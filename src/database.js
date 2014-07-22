var leveldown = require("./node/leveldown.js"),
    ndn;

var debug = true;

function Database (contentStore, policy, onopen){
  this.contentStore = contentStore
  this.nameTree = contentStore.nameTree;
  this.ndn = contentStore.ndn;
  this.levelWrapper = new leveldown(policy);
  this.levelWrapper._open = false
  this.populateNameTree(onopen);
  return this;
}

Database.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

Database.prototype.puts = []

Database.prototype.getQueue = []

Database.prototype.insertQueue = function(item){
  var self = this;
  var db = this.levelWrapper
  if (item){
    if (debug) console.log("adding item to put queue")
    this.puts.push({
      type: 'put'
      , key: item.data.name.toUri()
      , value: item.element
      , data: item.data
      , callback : item.callback
    })
  }
  if (db._open){
    if (!this.hasPendingInsert){
      this.hasPendingInsert = true;
      setTimeout(this.insertQueue, 25)
    }else{
      this.hasPendingInsert = false;
    }
  } else {
    if (self.puts.length > 0)
    {
      db._open = true
      if (debug) {
        console.log("putting following uris from queue: ")
        for (var i = 0 ; i  < self.puts.length; i++)
          {console.log(self.puts[i].key)}
      }
      db.down.open({
        blockSize : 10240
      }, function(err){
        if(err){
          if (debug) console.log(err)
          return;
        }

        var batch = self.puts
        self.puts = []
        db.down.batch(batch, function(err){
          if (err){
            if (debug) console.log("batch err:",err);
            self.puts.concat(batch)
          }else{
            for(var i = 0; i < batch.length; i++ ){
              self.contentStore.insert(batch[i].value, batch[i].data)
              if (debug){ console.log("item " + batch[i].key + " inserted")}
              batch[i].callback()
            }
            if(debug) console.log("batch queue put success ")

          }
          db.down.close(function(err){
              if(err)
                if(debug) console.log("error in db.close", err);
              db._open = false
          })
        })
      })
    }
  }
}

Database.prototype.getElement = function(repoEntry, callback, self){
  var self = self || this;
  var db = self.levelWrapper
  if (debug) console.log("db._open", db._open)
  if(db._open){
    if(repoEntry){
      self.getQueue.push({
        repoEntry  : repoEntry
        , callback : callback
      })
    }
    setTimeout(self.getElement, 25, null, null, self)

  }else{
    if(!repoEntry){
      if(self.getQueue.length > 0){
        repoEntry = self.getQueue[0].repoEntry
        callback = self.getQueue[0].callback
        self.getQueue.shift();
      } else{
        return;
      }
    }
    db._open = true
    db.down.open({
      blockSize : 10240
    },function(err){
      if (err){
        if (debug) console.log(err);
        return;
      }
      db.down.get(repoEntry.uri, function(err, element){
        if (err){
          if (debug) console.log(err)
          return;
        }

        repoEntry.setElement(element)
        callback(element);
        function backLog(){
          if (self.getQueue.length > 0){
            var q = self.getQueue.shift();
            db.down.get(q.repoEntry.uri,function(err, element){
              if (err) return q.callback(err)

              callback(element)
              backLog()
            })
          } else{
            db.down.close(function(err){
              if (err && debug) console.log(err);
              db._open = false
            });
          }
        }
        backLog()
      })
    })
  }
}

Database.prototype.insert = function( element, data, callback){
  var db = this.levelWrapper;
  callback = callback || function(){};
  var self = this;
  if(db._open){
    if (debug) console.log("db open, adding to queue", element, data)
    self.insertQueue({
      data: data
      , element: element
      , callback: callback
    })
  }else{
    if (debug) console.log("db opening  ")
    db._open = true
    db.down.open({
      blockSize : 10240
    },function(err){
      if (debug) console.log("Database.insert: database open", element, err)
      if (err){
        return callback(err);
      }
      db.down.put(data.name.toUri(), element, function(err){
        if (debug) console.log("put success callback", err)
        if (err )
          return callback(err);
        else if (!err){
          self.contentStore.insert(element, data)
        }

        db.down.close(function(err){
          if (debug) console.log("db close in .insert")
          if (err)
            return callback(err);
          db._open = false
          callback()
        });
      })
    })
  }
  return this;
}

Database.prototype.populateNameTree = function(cb){
  var self = this
    , db = self.levelWrapper;
  if (debug) console.log("Database.populateNameTree")
  if(db._open){
    if (debug) console.log("db already open, waiting")
    setTimeout(this.populateNameTree,25)
  }else{
    db._open = true
    db.down.open({
      blockSize: 10240
    }, function(err){

      if (debug) console.log("db open in populateNameTree",err);
      if (err){
        return;
      }
      var iterator = db.down.iterator({
        values        : false
        , keyAsBuffer : false
      });

      function builder(err, uri){

        if (debug) console.log("builder iterator", uri, err, iterator.next);
        if (err){
          return builder(null, null)
        } else if (uri) {
          if (debug) console.log("builder iterator.next", self.nameTree, self.contentStore);
          var node = self.nameTree.lookup(uri)
          self.contentStore.insert(null, new ndn.Data(new ndn.Name(uri), new ndn.SignedInfo(), "entry"))
          if (debug) console.log("builder iterator.next");
          iterator.next(builder);
        } else {
          db.down.close(function(err){
            if (debug) console.log("end of builder iterator")
            if(err && debug)
              console.log(err);
            db._open = false;
            db.spun = true;
            if (self.checkQueue.length > 0){
              for (var i = 0; i < self.checkQueue.length; i++ ){
                self.check(self.checkQueue[i].interest, self.checkQueue[i].callback)
              }
            }
            if (debug) console.log(Object.keys(self.contentStore.nameTree))
            self.insertQueue();
            if (self.getQueue.length > 0){
              var q = self.getQueue.shift()
              if (debug) console.log("nameTree populated, fetching from queue")
              db.getElement(q.repoEntry, q.callback)
            }
            if (cb) cb()
          });
        }
      }

      iterator.next(builder);
    })
  }
}

Database.prototype.checkQueue = []

Database.prototype.check = function(interest, callback) {
  if (!this.spun){
    this.checkQueue.push({interest: interest, callback : callback})
  }
  this.contentStore.check(interest, callback)
  return this;
}

module.exports = Database
