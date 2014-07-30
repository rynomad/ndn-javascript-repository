function Policy(policy){
  this.policy = policy;
}

Policy.prototype.acceptStorageRequest = function(){
  return true;
};
