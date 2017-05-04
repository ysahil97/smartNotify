var express = require('express');
var fs        = require('fs');
var publicdir = __dirname + '/public';
var MongoClient=require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var bodyParser = require('body-parser');
var time = require('time');

var app = express();

// app.set('view engine', 'ejs');
var maxLimit = 5;

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

var scheduleImm = function(db,object,callback){
  db.collection('userCount').find().each(function(err, doc){
    if (err) throw err;
    if (doc!=null){
      var today = new Date();
      // var j = schedule.scheduleJob(today,function(){
        // sendNotification(object,doc.user_name);
        console.log("Notification sent immediately to all users");
      // });
    }
    else{
      callback();
    }
});
}

var scheduleIntelligent = function (db,object,callback){
  db.collection('userCount').find().each(function(err, doc){
    if (err) throw err;
    if (doc!=null){
      if(doc.count >= maxLimit){
        var today = new Date();
        var tomorrow = new Date();
        tomorrow.setDate(today.getDate()+1);

        var j = schedule.scheduleJob(tommorow,function(){
          // sendNotification(object,doc.user_name);
          console.log("Notification sent 24 hrs from now to all users");
        });

      }
      else{
        var morning=0, afternoon=0, evening=0;
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
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '').hour
        if(morning > afternoon && morning > evening && dateObject.hour <= 10){
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,10,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            // sendNotification(object,doc.user_name);
            console.log("Notification sent intelligently to all users");
          });
        }
        else if (afternoon > morning && afternoon > evening && dateObject.hour <= 14) {
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,14,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            // sendNotification(object,doc.user_name);
            console.log("Notification sent intelligentlyto all users");
          });
        }
        else if (evening > morning && afternoon < evening && dateObject.hour <= 18) {
          var scheduleDate = new Date(dateObject.year,dateObject.month-1,dateObject.day,18,0,0)
          var j = schedule.scheduleJob(scheduleDate,function(){
            sendNotification(object,doc.user_name);
          });
        }
        else{
          var j = schedule.scheduleJob(today,function(){
            // sendNotification(object,doc.user_name);
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

app.use(express.static(__dirname + '/'));

// app.use(express.static(publicdir));
/*app.use('/static', express.static('public'));*/
app.use(express.static(__dirname + '/'));


app.get('/', function(req, res){
  // The form's action is '/' and its method is 'POST',
  // so the `app.post('/', ...` route will receive the
  // result of our form
  /*var html = '<form action="/" method="post">' +
               'Enter your name:' +
               '<input type="text" name="userName" placeholder="..." />' +
               '<br>' +
               '<button type="submit">Submit</button>' +
            '</form>';

  res.send(html);*/

  fs.readFile('cutshortTestForm.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });/*
fs.readFile('studentForm.css', function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(data);
        res.end();
      });*/
});


app.post('/cutshortTestForm.html', function(req, res){
  var text = req.body.nText;
  var priority = req.body.nPriority;
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
  /*assert.equal(null, err);*/
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

//   insertDocument(db, function() {
//     findRestaurants(db, function() {
//     db.close();
// });
//   },speaker);
});

});
app.listen(8080);