var VError = require('verror');
var objectID=require('mongodb').ObjectID;

var Collection = function(config, collection){

  var table = collection;

  table.first = function(user, next){
    var json = JSON.stringify(user);
    var criteria = JSON.parse(json);

    if(criteria.id) {
      criteria = map_IDProperty(criteria);
    }
    table.findOne(criteria, function(err, doc) {
      if(err) return next(new VError(err, "table.findOne"));

      var found = mapIDProperty(doc);
      next(err, found);
    });
  };

  table.exists = function(criteria, next){
    if(criteria.id) {
      criteria = map_IDProperty(criteria);
    }
    table.find(criteria).toArray(function(err, items) {
      if(err) return next(new VError(err, "table.find"));

      next(err, items.length === 1);
    });
  };

  table.query = function(criteria, next){
    var list = [];
    table.find(criteria).toArray(function(err, items) {
      if(err) return next(new VError(err, "table.find"));

      for (var i=0; i < items.length; i++){
        list.push(mapIDProperty(items[i]));
      }
      next(err, items);
    });
  };

  table.paginationQuery = function(criteria, next){
    var list = [];
    table.find(criteria.query).limit(criteria.limit).skip(criteria.skip).toArray(function(err, items) {
      if(err) return next(new VError(err, "table.find"));

      for (var i=0; i < items.length; i++){
        list.push(mapIDProperty(items[i]));
      }
      next(err, items);
    });
  };

  table.length = function(next){
    table.find({}).toArray(function(err, items) {
      if(err) return next(new VError(err, "table.find"));

      next(err, items.length);
    });
  };

  table.saveData = function(thing, next){
    table.save(thing, function(err, doc) {
      table.findOne((thing), function(err, doc) {
        if(err) return next(new VError(err, "table.findOne"));

        next(err, mapIDProperty(doc));
      });
    });
  };

  table.updateOnly = function(updates, id, next){

    if(updates.id) {
      updates = map_IDProperty(updates);
    }

    table.update({"_id": objectID(id)}, {$set: updates}, null, function(err, writeResult) {
      mapIDProperty(updates);
      next(err, writeResult.result.ok === 1);
    });
  };

  table.destroyAll = function(next){
    table.find().toArray(function(err, items) {
      table.remove();
      next(err, items.length);
    });
  };

  table.destroy = function(id, next){
    table.remove( {"_id": objectID(id)});
    table.find({"_id": objectID(id)}).toArray(function(err, items) {
      next(err, items.length === 0);
    });
  };


  table.index = function(att, next){
    collection.ensureIndex( {att : 1});
    next(null, true);
  };

  table.groupquery = function(criteria, next){

     table.aggregate([
       {
            $group: {
              _id : {
                date: {
                  day : {$dayOfMonth : "$createdAt"},
                  month : {$month : "$createdAt"},
                  year : {$year : "$createdAt"}
                },
                entry:"$entry"
              },
              count : {$sum : 1}
          }},
          {
            $group : {
              "_id" :'$_id.date',
              "entry":{
                "$push":{
                  entry:"$_id.entry",
                  count:"$count"
                }
              }
          }},
          {$sort : {"_id.year":-1, "_id.month":-1, "_id.day":-1}},
          {$limit: 10}
        ],function(err,result){
          next(err, result);

        })
  };

  table.last = function(user, next){
    table.find().sort({_id : -1}).limit(1).toArray(function(err, items){
      var doc = mapIDProperty(items[0])
      next(err, doc);
    });
  };

  var mapIDProperty  = function(obj) {
    if (obj) {
      if(obj.id !== null) {
        obj.id = obj._id;
        delete obj._id;
      }
    }
    return obj;
  };

  var map_IDProperty = function(obj) {
    if(obj) {
      if(obj.id !== null) {
        obj._id = objectID(obj.id);
        delete obj.id;
      }
    }
    return obj;
  };

  return table;
};

module.exports = Collection;
