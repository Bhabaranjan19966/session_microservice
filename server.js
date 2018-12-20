const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const UUID = require('uuid/v4');
var db;

app.use(bodyParser.json());

MongoClient.connect('mongodb://mongodb:27017/', (err, client) => {
    if (err) { console.log("-----------------------------", err); }

    db = client.db('test-db');
    console.log('connected to data base');
    app.listen(port, () => {
        console.log("app is running on port :", port);
    });
})

app.get('/getdata/:batchid', (req, res) => {
    let arr = [];
    console.log(req.params.batchid);

    db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
        console.log(result)
    });
    res.json("data received");
})



app.post('/create-session', (req, res) => {
    let batchid = String(req.body.identifier);
    db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
        if (err) {
            console.log("some error ---------------", err);
        } else {
            if (result === null) {
                let sessionID = UUID();
                req.body.sessionDetails.sessionId = sessionID;
                db.collection('quotes').save({ 'identifier': batchid, "sessions": [req.body] }, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    res.send('data successfully inserted to the database');
                })
            } else {

                const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartTime);
                const newSessionEndTime = new Date(req.body.sessionDetails.sessionEndTime);
                console.log(newSessionStartTime, newSessionEndTime);
                let sessionID = UUID();
                let val = false;
                result.sessions.map(session => {
                    console.log("inside map");
                    let eSessionStartTime = new Date(session.sessionDetails.sessionStartTime);
                    let eSessionEndTime = new Date(session.sessionDetails.sessionEndTime);
                    let eSessionId = session.sessionDetails.sessionId;
                    if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.send("cannot create session as you have id");
                    } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.send("cannot create session as you have id");

                    } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.send("cannot create session as you have id");

                    }

                })
                if (!val) {
                    req.body.sessionDetails.sessionId = sessionID;
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    console.log("db updated");
                    res.send("updated successfully");
                }

            }
        }
    })
})



app.post('/update-session', (req, res) => {
    let sessionid = String(req.body.sessionDetails.sessionId);
    let batchid = String(req.body.identifier);
    
    var promise = new Promise( (resolve,reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        setTimeout(()=>{
            resolve();
        },300)
    })

    promise.then(()=>{
        console.log(sessionid,req.body.sessionDetails.sessionID);
        db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
            if (err) {
                console.log('error in performing operation', err);
            } else {
    
                if (result.sessions.length === 0) {
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    console.log("db updated");
                    res.send('sent data');
                } else {
                    const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartTime);
                    const newSessionEndTime = new Date(req.body.sessionDetails.sessionEndTime);
                    console.log(newSessionStartTime, newSessionEndTime);
                    let val = false;
                    result.sessions.map(session => {
                        console.log("inside map");
                        let eSessionStartTime = new Date(session.sessionDetails.sessionStartTime);
                        let eSessionEndTime = new Date(session.sessionDetails.sessionEndTime);
                        // let eSessionId = session.sessionDetails.sessionId;
                        if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.send("cannot create session as you have id");
                        } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.send("cannot create session as you have id");
    
                        } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.send("cannot create session as you have id");
    
                        }
    
                    })
                    if (!val) {
                        result.sessions.push(req.body);
                        db.collection('quotes').update({ "identifier": batchid }, result);
                        console.log("db updated");
                        res.send("updated successfully");
                    }
    
    
                }
            }
    
        })
    })
   
})



app.delete('/delete-session', (req,res) => {
    let sessionid = String(req.body.sessionDetails.sessionId);
    
    var promise = new Promise( (resolve,reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        setTimeout(()=>{
            resolve();
        },300)
    })

    promise.then(()=> {
        res.send('session deleted');
    })    
})


