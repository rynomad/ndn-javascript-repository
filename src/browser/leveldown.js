var leveldown = require('level-js')

function levelWrapper(policy, debug){
  console.log("PING")
  this.down = new leveldown("/");
  return this;
}


module.exports = levelWrapper;
