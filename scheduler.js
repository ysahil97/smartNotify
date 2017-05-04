var express = require('express');
var fs        = require('fs');
var publicdir = __dirname + '/public';
var MongoClient=require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var bodyParser = require('body-parser');
var time = require('time');

var app = express();

//variable to define maxLimit of user notifications clicked
var maxLimit = 5;

//helper function to access parts of date string
var dateToObject = function(s){
  var dateObject = new Object();
  dateObject.year = parseInt(s.splice(0,4));
  dateObject.month = parseInt(s.splice(5,7));
  dateObject.day = parseInt(s.splice(8,10));
  dateObject.hour = parseInt(s.splice(11,13));
  dateObject.minute = parseInt(s.splice(14,16));
  dateObject.second = parseInt(s.splice(15,17));
  return dateObject;
}

//function which schedules immediately to send notifications
var scheduleImm = function(db,object,callback){
  db.collection('userCount').find().each(function(err, doc){
    if (err) throw err;
    if (doc!=null){
      var today = new Date();

        console.log("Notification sent immediately to all users");

    }
    else{
      callback();
    }
});
}

//function which schedules intelligently to send notifications
var scheduleIntelligent = function (db,object,callback){
  db.collection('userCount').find().each(function(err, doc){
    if (err) throw err;
    if (doc!=null){
      //if the user has clicked maximum number of times
      if(doc.count >= maxLimit){
        var today = new Date();
        var tomorrow = new Date();
        tomorrow.setDate(today.getDate()+1);
        //schedule sending notification 24 hours from now
        var j = schedule.scheduleJob(tommorow,function(){
          console.log("Notification sent 24 hrs from now to all users");
        });

      }
      else{
        var morning=0, afternoon=0, evening=0;
        //check over the database to search for likeliest available time window
        db.collection('userAssign1').find({user_name: doc.user_name}).each(function(err,doc){
          if (err) throw err;
          if (doc!=null){
            var hour = parseInt(doc.time.splice(11,13));
            if(hour  >= 8 && hour < 12)morning += 1;
            else if (hour >= 12 && hour < 16)afternoon += 1;
            else if (hour >=16 && hour < 20)evening += 1;
          }
          else{
            callback();
          }
        });
        var today = new Date();
        var dateObject = today.toISOString().
        replace(/T/, ' ').      
        replace(/\..+/, '').hour
        //according to the time window selected, send the notification at its median time
        if(morning > afternoon && morning > evening && dateObject.hour <= 10){
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,10,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            console.log("Notification sent intelligently to all users");
          });
        }
        else if (afternoon > morning && afternoon > evening && dateObject.hour <= 14) {
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,14,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            console.log("Notification sent intelligentlyto all users");
          });
        }
        else if (evening > morning && afternoon < evening && dateObject.hour <= 18) {
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,18,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            sendNotification(object,doc.user_name);
          });
        }
        // if none of the time windows are available, send it immediately
        else{
          var j = schedule.scheduleJob(today,function(){
            console.log("Notification sent immediately and intelligently to all users");
          });
        }
      }
    }
    else{
     callback();}
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

// app.use(express.static(__dirname + '/'));

app.use(express.static(publicdir));

app.use(express.static(__dirname + '/'));


app.get('/', function(req, res){

  fs.readFile('cutshortTestForm.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
});


//when the server receives data for post, it schedules accordingly
app.post('/cutshortTestForm.html', function(req, res){
  var text = req.body.nText;
  var priority = req.body.nPriority;
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server.");
  if(priority == 1){
    scheduleImm(db,text,function(){
      findRestaurants1(db, function() {
      db.close();
      });
    });
  }
  else{
    scheduleIntelligent(db,text,function(){
      findRestaurants1(db, function() {
      db.close();
      });
    });
  }
});
});
// the app will forever listen to this server
app.listen(8080);