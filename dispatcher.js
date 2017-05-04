var express = require('express');
var fs        = require('fs');
var publicdir = __dirname + '/public';
var MongoClient=require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var bodyParser = require('body-parser');
var time = require('time');

var app = express();

//helper function to determine which among the two timestamps is the earliest
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

// helper function to modify a timestamp 24 hours before
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

//function to check for each notification clicked and insert it if it has been clicked in the last 24 hours
var updateCollection = function(db, callback) {
  db.collection('testNotify').find().each(function(err, doc){
    if (err) throw err;

    if(doc!=null){
      var time = new Date().toISOString().
      replace(/T/, ' ').      // replace T with a space
      replace(/\..+/, '') ;
      var time1 = doc.time;
      console.log("comparing..")
      if(compareTimestamp(change24Before(time),time1) >= 0){
        var user = new Object();
        user.user_name = doc.user_name;
        user.time = doc.time;
        console.log("Inserting into new collection..");
        db.collection('userAssign1').insertOne(user, function(err, result) {

         console.log("Inserted a document into the userLog collection.");

       });
   }}else{
    callback();}
  });
};

//function to check the number of times user has clicked notifications in the last 24 hours. result is stored in the database
var makeUserCount = function(db, callback) {
  db.collection('userAssign1').find().each(function(err, doc){
    if(doc!=null){
      db.collection('userCount').update({"user_name" : doc.user_name},{$inc : {"count" : 1}},{ upsert: true},function(err, result) {
      console.log("updated a document into the userCount collection.");});
      // callback();
    }
    else{
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

var findRestaurants1 = function(db, callback) {
   var cursor =db.collection('userCount').find( );
   cursor.each(function(err, doc) {
      /*assert.equal(err, null);*/
      if (doc != null) {
         console.log("Starting to print...\n")
         console.dir(doc);
      } else {
         callback();
      }
   });
};


app.use(express.static(publicdir));
/*app.use('/static', express.static('public'));*/
app.use(express.static(__dirname + '/'));


//server is started and the dispatcher is scheduled to run every midnight
app.post('/', function(req, res){

var today = new Date();
var tomorrow = new Date();
tomorrow.setDate(today.getDate()+1);
console.log(tomorrow);

var j = schedule.scheduleJob('0 0 0 * *', function(){
var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
    console.log("Connected correctly to server.");
    updateCollection(db, function() {
        makeUserCount(db, function() {
          findRestaurants1(db, function() {

          db.close();
        });
    });
  });
});
});

res.send("Entry Made Into user DataBase");
});

app.listen(8080);