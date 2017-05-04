var express = require('express');
var fs        = require('fs');
var publicdir = __dirname + '/public';
var MongoClient=require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var bodyParser = require('body-parser');
var time = require('time');

var app = express();

var insertDocument = function(db, callback, object) {
   db.collection('notifyData').insertOne(object, function(err, result) {

    console.log("Inserted a document into the notifications collection.");
    callback();
  });
};

var change24Before = function(s){
  var p1 = s.slice(0,10);
  var p2 =s.slice(10);
  if(parseInt(p1.slice(8,10)) == 1){
    if(parseInt(p1.slice(5,7)) == 1){
      var num = (parseInt(p1.slice(0,4)) -1).toString();
      var res  = num.concat("-12-31");
        return res;
      }
    else{
      if(parseInt(p1.slice(5,7))%2 == 0){
        var zero = "0";
        var num = (parseInt(p1.slice(5,7)) -1) < 10 ? zero.concat((parseInt(p1.slice(5,7)) -1).toString()) : (parseInt(p1.slice(5,7)) -1).toString();
        var res =  p1.slice(0,5).concat(num).concat("-31");
        return res.concat(p2);
      }
      else{
        if(parseInt(p1.slice(5,7)) == 3){
          var zero = "0";
           var num = (parseInt(p1.slice(5,7)) -1) < 10 ? zero.concat((parseInt(p1.slice(5,7)) -1).toString()) : (parseInt(p1.slice(5,7)) -1).toString();
           var res =  p1.slice(0,5).concat(num).concat("-28");
          return res.concat(p2);
        }
        else{
          var zero = "0";
          var num = (parseInt(p1.slice(5,7)) -1) < 10 ? zero.concat((parseInt(p1.slice(5,7)) -1).toString()) : (parseInt(p1.slice(5,7)) -1).toString();
          res =  (p1.slice(0,5).concat(num)).concat("-30");
          return res.concat(p2);
        }
      }
    }
  }
  else{
    var zero = "0";
    res = p1.slice(0,8).concat((parseInt(p1.slice(8,10)) -1) < 10 ? zero.concat((parseInt(p1.slice(8,10)) -1).toString()) : (parseInt(p1.slice(8,10)) -1).toString())
      return res.concat(p2);
  }

};

var compareTimestamp = function(s,t){
  if (parseInt(s.slice(0,4)) > parseInt(t.slice(0,4))){
        return -1;
  }
  else if (parseInt(s.slice(0,4)) < parseInt(t.slice(0,4))) return 1;
  else{
    if(parseInt(s.slice(5,7)) > parseInt(t.slice(5,7))){
      return -2;
    }
    else if (parseInt(s.slice(5,7)) < parseInt(t.slice(5,7))) return 2;
    else{
      if(parseInt(s.slice(8,10)) > parseInt(t.slice(8,10))){
        return -3;
      }
      else if(parseInt(s.slice(8,10)) < parseInt(t.slice(8,10))) return 3;
      else{
        if(parseInt(s.slice(11,13)) > parseInt(t.slice(11,13))){
          return -4;
        }
        else if (parseInt(s.slice(11,13)) < parseInt(t.slice(11,13))) return 4;
        else{
          if(parseInt(s.slice(14,16)) > parseInt(t.slice(14,16))){
            return -5;
          }
          else if(parseInt(s.slice(14,16)) < parseInt(t.slice(14,16))) return 5;
          else{
            if(parseInt(s.slice(17)) > parseInt(t.slice(17))){
              return -6;
            }
            else if (parseInt(s.slice(17)) < parseInt(t.slice(17))) return 6;
            else{
              return 0;
            }
          }
        }
      }
    }
  }
};

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
/*app.use('/static', express.static('public'));*/
app.use(express.static(__dirname + '/'));

app.post('/', function(req, res){
  var notificationID = req.body.notificationID;
  var userName = req.body.user_name;
  var time = new Date().toISOString().
  replace(/T/, ' ').      // replace T with a space
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

app.listen(8080);