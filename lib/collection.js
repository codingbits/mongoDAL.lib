var assert = require("assert");

var Collection = function(config, collection){

    var table = collection;

    table.first = function(criteria, next){
        table.findOne((criteria), function(err, doc) {
            assert.equal(null, err);
            next(err, doc);
        });
    };

    table.exists = function(criteria, next){
        table.find(criteria).toArray(function(err, items) {
            assert.equal(null, err);
            next(err, items.length === 1);
        });
    };

    table.query = function(criteria, next){
        table.find(criteria).toArray(function(err, items) {
            assert.equal(null, err);
            next(err, items);
        });
    };

    table.saveData = function(thing, next){
        table.save(thing);
        table.findOne((thing), function(err, doc) {
            assert.equal(null, err);
            next(err, doc);
        });
    };

    table.updateOnly = function(updates, id, next){
        table.update({"_id": id}, {$set: updates}, null, function(err, writeResult) {
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
        table.remove( {"_id": id});
        table.find({"_id": id}).toArray(function(err, items) {
            next(err, items.length === 0);
        });
    };


    table.index = function(att, next){
        collection.ensureIndex( {att : 1});
        next(null, true);
    };

    return table;
};

module.exports = Collection;