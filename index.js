var MongoClient = require('mongodb').MongoClient;

var assert = require("assert");
var _ = require("lodash");
var async = require("async");

var Collection = require("./lib/collection");

var MongoDAL = function(){

  var self = this;
  var config = {};
  var db;


  var setConfig = function(args){
    config.uri = args.uri || null;
    config.host = args.host || "localhost";
    config.db = args.db;
    config.port = args.port || 27017;
  };

  var getUrl = function(dbName) {

    if(config.uri !== null) {
      return config.uri;
    }
    var url = 'mongodb://' + config.host + ':' + config.port + '/';
    if(dbName) {
      return url + dbName;
    }
    return url + config.db;
  };

  /*
   The first method to call in order to use the API.
   The connection information for the DB. This should have {host, db, port}; host and port are optional.
   */
  self.connect = function(args, next){
    setConfig(args);

    MongoClient.connect(getUrl(), function(err, db) {
      assert.equal(null, err);

      db.collections(function(err, collections) {
        if(!err){
          _.each(collections, function(collection){
            if(collection.collectionName !== 'system.indexes') {
              self[collection.collectionName] = new Collection(config, collection);
            }
          });
        }
        next (err, self);
      });

    });

  };

  self.openConnection = function(next){
    MongoClient.connect(getUrl(), next);
  };

  self.createDb = function(dbName, next){

    MongoClient.connect(getUrl(dbName), function(err, db) {
      assert.ok(err === null, err);

      db.db(dbName);
      db.close();
      next(err, db);
    });
  };

  self.dropDb = function(dbName, next){
    MongoClient.connect(getUrl(dbName), function(err, db) {
      assert.ok(err === null, err);

      db.dropDatabase(function(err, result) {
        assert.ok(err === null, err);
        db.close();
        next(err, result);
      });

    });
  };

  self.createCollection = function(collection, next){
    MongoClient.connect(getUrl(), function(err, db) {
      assert.ok(err === null, err);

      db.createCollection(collection, function(err) {
        assert.ok(err === null, err);
        next(err, err === null);
        db.close();
      });

    });
  };

  self.collectionExists = function(collection, next){
    MongoClient.connect(getUrl(), function(err, db) {
      assert.equal(null, err);

      db.collections(function(err, collections){
        assert.ok(err === null, err);
        var result = false;

        _.each(collections, function(table){
          if(table.collectionName === collection) {
            result = true;
          }
        });

        next(err, result);
        db.close();

      });

    });

  };


  self.dbExists = function(dbName, next){

    MongoClient.connect(getUrl(), function(err, db) {
      assert.equal(null, err);

      db.admin().listDatabases(function(err, dbs) {
        assert.ok(err === null, err);
        var result = false;

        _.each(dbs.databases, function(db){
          if(db.name === dbName) {
            result = true;
          }
        });
        next(err, result);
        db.close();
      });

    });
  };


  self.install = function(collections, next){
    assert.ok(collections && collections.length > 0, "Be sure to set the tables array on the config");

    self.createDb(config.db, function(err, db){
      assert.ok(err === null, err);

      async.each(collections, self.createCollection, function(err) {
        assert.ok(err === null, err);
        next(err, err === null);
      });

    });
  };


  return self;
};

module.exports = new MongoDAL();
