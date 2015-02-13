# Abstraction Layer for MongoDB

We wanted to be able to provide a common interface to different databases.

1. MongoDB
2. RethinkDB
3. Direct File System

The [second-thought](https://github.com/robconery/second-thought/blob/master/README.md) module from Rob Conery provided a nice simple way to do this. So assuming that no lower level data was made out of the abstraction one could replace the Abstraction and switch databases. This code base then is a direct adaption of his code and ideas. Since RethinkDB uses 'id' and Mongo uses '_id' the code ensures that 'id' is available.

__Functionality:__

 - Query, which returns an array
 - First, Exists
 - Save, which upserts a record
 - Automatic table/db config
 - DB Manipulation (Create/Drop)


## Usage

We haven't pushed this up to NPM yet.
Install using

```
npm install git+https://github.com/vzdigitalmedia/mongoDAL.lib --save
```

To use this in your code, just configure what you need:

```javascript
var db = require("mongoDAL");
db.connect({db : "test"}, function(err,db){

  //you now have access to all of your tables as properties on your db variable:
  //so, assume there's a table called "foo" in your db...
  db.foo.save({name : "Mike"}, function(err,saved){

    //output the generated ID
    console.log(saved.id);
  });

});
```

Each table on your DB object is a full-blown Mongo collection, so you can step outside the abstraction at any point:

```javascript
db.openConnection(function(err,conn){

  //this is a ReQL query
  db.foo.eqJoin('bar_id', db.bar).run(conn, function(err,cursor){

    //run the joined action and do something interesting
    cursor.toArray(function(err,array){
      //use the array...

      //be sure to close the connection!
      conn.close();
    });

  });
});

```

In addition you can do all kinds of fun things, like...

```javascript
//installation of the DB and tables
db.connect({db : "test"}, function(err, db){
  db.install(['foo', 'bar'], function(err,result){
    //tables should be installed now...
  });
});

//add a secondary index
db.connect({db : "test"}, function(err,db){

  db.foo.index("email", function(err, indexed){
    //indexed == true;
  });
});
```

## Basic Queries

```javascript

db.connect({db : "test", function(err,db){

  db.foo.query({category : "beer"}, function(err,beers){
    //beers is an array, so have at it
  });

  db.foo.first({email : "john.doe@mail.com"}, function(err,rob){
    //hi John
  });

  db.foo.exists({name : "bill"}, function(err, exists){
    //exists will tell you if it's there
  });

  db.foo.destroy({id : "some-id"}, function(err,destroyed){
    //destroyed will be true if something was deleted
  });

  db.foo.destroyAll(function(err,destroyed){
    //destroyed is the count of records whacked
  });

  db.foo.updateOnly({name : "Stevie"}, "some-id", function(err,result){
    //save will do a full swap of the document, updateOnly will partially update
    //a document so you need to pass the id along
    //result will be true if an update happened
  });

});

```

Have a look at the tests to see a bit more
