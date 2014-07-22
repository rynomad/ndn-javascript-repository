var leveldown = require('level-js')

function levelWrapper(policy, debug){
  this.down = new leveldown("/");
  return this;
}


module.exports = levelWrapper;
