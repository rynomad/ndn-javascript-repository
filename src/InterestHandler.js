var io = require("ndn-io")
var Policy = require("./policy.js")

var CODE = {
  CONTENTRECEIVED: 0
  , STORAGEREQUESTREJECTED: 1
  , DATANOTFOUND: 2
}

function InterestHandler (face, database, policy){
  this.policy = new Policy(policy)
  this.face = face
  this.database = database;
  this.ndn = database.ndn;
  this.io = new io(face, database.nameTree)
  io.installFace(face, this.onInterest)
}

InterestHandler.prototype.nack = function(interest, code){
  //send nack packet
  var nack = "dummy"
  self.face.transport.send(nack)
}

InterestHandler.prototype.ack = function(interest, code){
  //send storage ack
  var ack = "dummy"
  this.face.transport.send(ack)
}

InterestHandler.prototype.isStorageRequest = function(interest){
  //return true or false
  return false
}

InterestHandler.prototype.parseStorageRequest = function(interest){
  //return {uri, finalBlockId}
  return false
}

InterestHandler.prototype.onInterest = function(interest){
  var self = this;
  if (this.isStorageRequest(interest)){
    var request = this.parseStorageRequest(interest);
    if (this.policy.acceptStorageRequest(request)){
      return io.fetchAllSegments(request.uri, function(data, element){
        self.database.insert(element, new self.database.contentStore.EntryClass(element, data), function(){
          if (self.ndn.DataUtils.arraysEqual(data.getMetaInfo().getFinalBlockID, request.finalBlockID)){
            self.ack(interest, CODE.CONTENTRECEIVED)
          }
        })
      })
    } else {
      return this.nack(interest, CODE.STORAGEREQUESTREJECTED)
    }
  } else {
    this.database.check(interest, function(element){
      if (!element){
        self.nack(interest, CODE.DATANOTFOUND)
      } else{
        self.face.transport.send(element);
      }
    })
  }
  return this;
}
