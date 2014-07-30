var leveldown = require("leveldown"),
    levelup = require("levelup"),
    path = (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "") + "/.NDN-Repo",
    ndn;
var window;
var debug = true;

function Database (contentStore, policy, onopen){
  var self = this;
  this.index = contentStore;
  this.nameTree = contentStore.nameTree;
  this.ndn = contentStore.ndn;
  this.db = levelup(policy.path || path, {db: leveldown,
                                          valueEncoding: "json"
                                         }, function(){
    self.populateNameTree(onopen);
  });
  return this;
}

Database.installNDN = function(NDN){
  ndn = NDN;
  return this;
};


Database.prototype.getElement = function(repoEntry, callback){
  console.log("getElement ", repoEntry.uri)
  this.db.get(repoEntry.uri, function(err, data){
   if (!Buffer.isBuffer(data)){
     console.log("not buffer", data)
     data = new Buffer(data);
   }
   console.log(err, typeof data)
   callback(err, data)
  });

};

Database.prototype.insert = function(element, data, callback){
  var db = this.db;
  callback = callback || function(){};
  var self = this;
  console.log("inserting ", data.name.toUri())
  db.put(data.name.toUri(), element, function(err){
    //console.log("inserted?", err, element);
    self.index.insert(element,data);
    callback(err);
  });

  return this;
};

Database.prototype.populateNameTree = function(cb){
  var self = this
    , db = self.db;
  cb = cb || function(){return;};

  db.createKeyStream()
    .on("data",function(key){
      console.log("got Key in pop", key)
      self.index.insert(null, new ndn.Data(new ndn.Name(key)));
    })
    .on("error", function(err){
      cb(err);
    })
    .on("close", function(){
      self.spun = true;
      cb();
    });

};

Database.prototype.checkQueue = [];

Database.prototype.check = function(interest, callback, db) {
  db = db || this;
  if (!db.spun){
    setTimeout(db.check, 200, interest, callback, db);
  } else {
    db.index.check(interest, callback);
  }
  return this;
};

module.exports = Database;
