var Database = require("../../lib/database.js");
var assert = require('assert');
var NameTree = require("ndn-data-structures").NameTree;
var RepoEntry = require("../../lib/repoEntry.js");
var ndn = require("ndn-lib");

NameTree.installModules(ndn)
var nameTree = new NameTree()
var repo = new Database({nameTree: nameTree}, {})

describe("Database.populateNameTree()", function(){
  it("should populate from memory", function(done){
    function waitForSpin(){
      //console.log(repo.puts)
      if (repo.levelWrapper.spun && repo.puts.length == 0) {
        assert(repo.nameTree['/a/b/c/d'])
        done()
      } else setTimeout(waitForSpin, 100)
    }
    waitForSpin()

  })
})
var entry, data;

describe("Database.insert()", function(){
  it("should insert Repo Entry", function(){
    data = new ndn.Data(new ndn.Name("a/b/c/d"), new ndn.SignedInfo(), "some test content")
    data.signedInfo.setFields()
    data.sign()
    var enc = data.wireEncode()
    entry = new RepoEntry(enc.buffer, data, repo);
  })
  it("should be reflected in the nametree", function(done){
    var waitForSpin = function waitForSpin(){
      //console.log(repo.puts)
      if (repo.levelWrapper.spun && repo.puts.length == 0) {
        assert(repo.nameTree['/a/b/c/d'])
        done()
      } else setTimeout(waitForSpin, 100)
    }
    waitForSpin()
  })
})

describe("Dataase.getElement", function(){
  it("should return element in callback", function(done){
    //console.log(entry)
    repo.getElement(entry, function(element){
      console.log("callback", element)
      var d = new ndn.Data()
      d.wireDecode(element);
      assert(element, data.wireEncode())
      done()
    })
  })
})
