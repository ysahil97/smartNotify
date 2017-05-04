# smartNotify
A backend API which helps in sending intelligent notifications to the users

The API consists of four files:-
1)cutshortTestForm.html:- A simple webpage used to create notifications, inputs are the notification text and the priority mode(1:- send immediately 2:- schedule immediately )
2)scheduler.js:- A node js service to receive inputs from the cutshortTestForm.html file and verify it with the database to predict the best time to send notification. For now, console.log() has been used to show that it works
3)dispatcher.js:- A nodejs service which scans over the database of notifications clicked and creates two new databases of notifications clicked in the last 24 hrs and the count of notifications clicked per user. It is scheduled to run at midnight everyday.(In the source code, "userCount" collection stores the count of notifications clicked per user and "userAssign1" collection stores the data of all notifications clicked per user in the last 24 hours).
4)open_tracker.js:- A node js service which, when run on a server, will listen for all the notifications clicked and will store it in the database.Input fields:- NotificationID, user_name.Time will be computed by the server and the data will be sent through POST request. This server has been tested by using "Postman" chrome extension.(In the source code, "notifyData" collection stores all the relevant data).
