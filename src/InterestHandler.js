//var Policy = require("./policy.js");

var CODE = {
  CONTENTRECEIVED: 0
  , STORAGEREQUESTREJECTED: 1
  , DATANOTFOUND: 2
};

/**InterestHandler has methods to interperet and respond to interest messages
 *@constructor
 *@param {Object} face the ndn.Face object for connection to local or remote forwarder
 *@param {Database} database a {@link Database} instance
 *@param {Object} policy a policy object
 *@returns {InterestHandler} a new InterestHandler instance
 */
function InterestHandler (io, database, policy){
  //this.policy = new Policy(policy);
  this.database = database;
  this.ndn = database.ndn;
  this.io = io;
  return this;
}

/** negative acknowledgement (not implimented)
 */
InterestHandler.prototype.nack = function(interest, code){
  //send nack packet
  //var nack = "dummy";
  //self.face.transport.send(nack);
};

/** acknowledgement (not implimented)
 */
InterestHandler.prototype.ack = function(interest, code){
  //send storage ack
  var ack = "dummy";
  this.face.transport.send(ack);
};

/** determine if the interest is a storage request
 *@param {Interest} interest the ndn.Interest object
 *@returns {Boolean}
 */
InterestHandler.prototype.isStorageRequest = function(interest){
  //return true or false
  return false;
};

/** parse a storage request
 *@param {Interest} interest the NDN.Interest object of the STORAGE REQUEST
 *@returns {Interest} an interest for the first segment of the data to store
 */
InterestHandler.prototype.parseStorageRequest = function(interest){
  //return {uri, finalBlockId}
  return false;
};

/**Interest handler main functino
 *@param {Interest} interest the ndn.Interest Object
 *@returns {this} for chaining
 */
InterestHandler.prototype.onInterest = function(interest){
  var self = this;
  if (this.isStorageRequest(interest)){
    var requestInterest = this.parseStorageRequest(interest);
    if (this.policy.acceptStorageRequest(requestInterest)){
      return io.fetchAllSegments(requestInterest, function(element, data, finalBlockID){
        self.database.insert(element, data, function(){
          if (self.ndn.DataUtils.arraysEqual(data.getMetaInfo().getFinalBlockID, requestInterest.finalBlockID)){
            self.ack(interest, CODE.CONTENTRECEIVED);
          }
        });
      });
    } else {
      return this.nack(interest, CODE.STORAGEREQUESTREJECTED);
    }
  } else {
    this.database.check(interest, function(element){
      if (!element){
        self.nack(interest, CODE.DATANOTFOUND);
      } else{
        self.face.transport.send(element);
      }
    });
  }
  return this;
};
