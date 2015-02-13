var MongoClient = require('mongodb').MongoClient;

var assert = require("assert");
var VError = require('verror');
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
      if(err) return next(new VError(err, "MongoClient.connect"));

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
      if(err) return next(new VError(err, "MongoClient.connect"));

      db.db(dbName);
      db.close();
      next(err, db);
    });
  };

  self.dropDb = function(dbName, next){
    MongoClient.connect(getUrl(dbName), function(err, db) {
      if(err) return next(new VError(err, "MongoClient.connect"));

      db.dropDatabase(function(err, result) {
        if(err) return next(new VError(err, "db.dropDatabase"));
        db.close();
        next(err, result);
      });

    });
  };

  self.createCollection = function(collection, next){
    MongoClient.connect(getUrl(), function(err, db) {
      if(err) return next(new VError(err, "MongoClient.connect"));

      db.createCollection(collection, function(err) {
        if(err) return next(new VError(err, "db.createCollection"));
        next(err, err === null);
        db.close();
      });

    });
  };

  self.collectionExists = function(collection, next){
    MongoClient.connect(getUrl(), function(err, db) {
      if(err) return next(new VError(err, "MongoClient.connect"));

      db.collections(function(err, collections){
        if(err) return next(new VError(err, "db.collections"));
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
      if(err) return next(new VError(err, "MongoClient.connect"));

      db.admin().listDatabases(function(err, dbs) {
        if(err) return next(new VError(err, "db.admin().listDatabases"));
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
      if(err) return next(new VError(err, "db.createDb"));

      async.each(collections, self.createCollection, function(err) {
        if(err) return next(new VError(err, "db.createCollection"));
        next(err, err === null);
      });

    });
  };


  return self;
};

module.exports = new MongoDAL();
