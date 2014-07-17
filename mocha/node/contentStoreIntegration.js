var ContentStore = require("ndn-data-structures").ContentStore;
var NameTree = require("ndn-data-structures").NameTree
var ndn = require('ndn-lib')
var RepoEntry = require("../../lib/repoEntry.js")
var DataBase = require("../../lib/database.js")
var assert = require("assert")


ContentStore.installModules(ndn)
NameTree.installModules(ndn)
var nameTree = new NameTree()

var index = new ContentStore(nameTree, RepoEntry)
RepoEntry.installDatabase(new DataBase(index, {}))

var repo = RepoEntry.database

var aa = new ndn.Data(new ndn.Name("a/aa/c/a"),new ndn.SignedInfo(),"testContent")
,bb = new ndn.Data(new ndn.Name("a/aa/c/d"),new ndn.SignedInfo(),"testContent")
,cc= new ndn.Data(new ndn.Name("a/b/a/d"),new ndn.SignedInfo(),"testContent")

,dd = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
,ee = new ndn.Data(new ndn.Name("a/b/ee/d"),new ndn.SignedInfo(),"testContent")
,ff = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
,gg = new ndn.Data(new ndn.Name("a/aa/ee/d/e/f/g"),new ndn.SignedInfo(),"testContent")

aa.signedInfo.setFreshnessPeriod(50)
bb.signedInfo.setFreshnessPeriod(50)
cc.signedInfo.setFreshnessPeriod(50)
ee.signedInfo.setFreshnessPeriod(50)
ff.signedInfo.setFreshnessPeriod(50)
gg.signedInfo.setFreshnessPeriod(50)
/*
/*
Uncomment this block when changing location of the db or on first test run, as they populate the leveldb


repo.insert( aa.wireEncode().buffer, new index.EntryClass( aa.wireEncode().buffer, aa))
    .insert( bb.wireEncode().buffer, new index.EntryClass( bb.wireEncode().buffer, bb))
    .insert( cc.wireEncode().buffer, new index.EntryClass( cc.wireEncode().buffer, cc))
    .insert( dd.wireEncode().buffer, new index.EntryClass( dd.wireEncode().buffer, dd))
    .insert( ee.wireEncode().buffer, new index.EntryClass(ee.wireEncode().buffer, ee))

    .insert( ff.wireEncode().buffer, new index.EntryClass(ff.wireEncode().buffer, ff))

    .insert( gg.wireEncode().buffer, new index.EntryClass(gg.wireEncode().buffer, gg))
*/
describe("repoEntry",function(){
  it("should set to node", function(done){
      d = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
    d.signedInfo.setFreshnessPeriod(50)
    d.signedInfo.setFields()

    d.sign()
    var el = d.wireEncode().buffer
    repo.insert( el,new index.EntryClass(el, d), function(){
      assert(index.nameTree.lookup(d.name).repoEntry.element)
      done()
    })


  })
  it("element should be consumed, but leave entry", function(done){
    setTimeout(function(){
      assert(!index.nameTree.lookup(d.name).repoEntry.element)
      assert(index.nameTree.lookup(d.name).repoEntry)
      done()
    },60)
  })
})

//console.log(cache.nameTree)
//console.log(cache.nameTree['/a'].children.length, cache.nameTree['/a'].children.length, cache.nameTree['/a/aa'].children[0].children[0].prefix.toUri())
describe("repository", function(){
  //console.log(cache.__proto__)
    it("should insert", function(done){
      dd.signedInfo.setFreshnessPeriod(1000)
      var el = dd.wireEncode()
      var dat = dd
      repo.insert(el.buffer, new index.EntryClass(el.buffer, dd), function(){
        assert(index.nameTree.lookup(dd.name).repoEntry.name.equals(dat.name))
        done()
      })
    })
    it("should find leftmost before timeout", function(done){


        var inst = new ndn.Interest(new ndn.Name("a"))
        var res = repo.check(inst, function(element){
          assert.deepEqual(element, cc.wireEncode().buffer)
          done()
        })
    })
    it("should find rightMost after timeout", function(done){
      var i = new ndn.Interest(new ndn.Name("a"))
      i.setChildSelector(1)
      setTimeout(function(){
        var res = repo.check(i, function(element){
          assert.deepEqual(element, gg.wireEncode().buffer)
          done()
        })

      }, 60)
    })
    it("should find rightMost with Exclude", function(done){
      var i = new ndn.Interest(new ndn.Name("a"))
      i.setChildSelector(1)
      i.setExclude(new ndn.Exclude([new ndn.Name.Component("aa")]))
      var res = repo.check(i, function(element){
        assert.deepEqual(element, ee.wireEncode().buffer)
        done()
      })
    })
    it("should find rightMost with minSuffix", function(done){
      var i = new ndn.Interest(new ndn.Name("a/aa"))
      i.setChildSelector(1)
      i.setMinSuffixComponents(4)
     //console.log(cache.nameTree)
      var res = repo.check(i, function(element){
        assert.deepEqual(element, gg.wireEncode().buffer)
        done()
      })
    })
    it("should return null for exclude", function(done){
      var i = new ndn.Interest(new ndn.Name('a'))
      i.setExclude(new ndn.Exclude([new ndn.Name.Component('b'), new ndn.Name.Component('aa')]))
      var res = repo.check(i, function(element){
        assert(!element)
        done()
      })
    })
    it("should return null for no match", function(done){
      var i = new ndn.Interest(new ndn.Name("c"))
      var res = repo.check(i, function(element){
        assert(!element)
        done()
      })
    })
    it("should return null for minSuffix", function(done){
      var i = new ndn.Interest(new ndn.Name("/"))
      i.setMinSuffixComponents(9)
      var res = repo.check(i, function(element){
        assert(!element)
        done()
      })
    })
    it("should return null for maxSuffix", function(done){
      var i = new ndn.Interest(new ndn.Name("/"))
      i.setMaxSuffixComponents(2)
      var res = repo.check(i, function(element){
        assert(!element)
        done()
      })
    })
    it("should succeed long after freshness timeout", function(done){
      var i = new ndn.Interest(new ndn.Name(''))
      setTimeout(function(){
        repo.check(i, function(element){
          assert(element)
          done()
        })
      }, 1001)
    })
})
