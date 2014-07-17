var leveldown = require('leveldown')
  , path = (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH) + "/.NDN-Repo";

function levelWrapper(policy, debug){
  this.down = new leveldown(policy.path || path);
  this.debug = debug
  return this;
}

module.exports = levelWrapper;
