var express = require('express');
var fs        = require('fs');
var publicdir = __dirname + '/public';
var MongoClient=require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var bodyParser = require('body-parser');
var time = require('time');

var app = express();

//function to insert document in the collection
var insertDocument = function(db, callback, object) {
   db.collection('notifyData').insertOne(object, function(err, result) {

    console.log("Inserted a document into the notifications collection.");
    callback();
  });
};

//function to update document in the collection,if it doesn't exist, it inserts it
var updateDocument = function(db, callback, object) {
   db.collection('notifyData').update({"notificationID" : object.notificationID},{"user_name" : object.user_name},{"time" : object.time},{$inc : {"count" : 1}},{ upsert: true},function(err, result) {
    console.log("updated a document into the notifications collection.");
    callback();
  });
};

//optional function to remove all documents in a function
var removeDocuments = function(db, callback) {
   db.collection('notifyData').deleteMany( {}, function(err, results) {
      console.log(results);
      callback();
   });
};

var findRestaurants = function(db, callback) {
   var cursor =db.collection('notifyData').find( );
   cursor.each(function(err, doc) {
      /*assert.equal(err, null);*/
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

app.use(bodyParser.urlencoded({
   extended: true
}));

app.use(function(req, res, next) {
  if (req.path.indexOf('.') === -1) {
    var file = publicdir + req.path + '.html';
    fs.exists(file, function(exists) {
      if (exists)
        req.url += '.html';
      next();
    });
  }
  else
    next();
});

app.use(express.static(publicdir));
app.use(express.static(__dirname + '/'));

//function which listens to the notifications clicked and stores it in 'notifyData' db
app.post('/', function(req, res){
  var notificationID = req.body.notificationID;
  var userName = req.body.user_name;
  var time = new Date().toISOString().
  replace(/T/, ' ').
  replace(/\..+/, '') ;
  var time1 = change24Before(time);
  var notify = new Object();

  notify.notificationID = notificationID;
  notify.user_name = userName;
  notify.time = time;
  notify.count = compareTimestamp(time1,time);

  console.log(notify);

  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server.");
  insertDocument(db, function() {
    findRestaurants(db, function() {
    db.close();
  });
},notify);
  });
  res.send("Entry Made Into DataBase");
});
//the service will listen at port 8082
app.listen(8082);