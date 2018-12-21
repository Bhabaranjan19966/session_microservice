const express = require('express');
const app = express();
const rxjs = require('rxjs')
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const UUID = require('uuid/v4');

const port = process.env.PORT || 8080;
var db;

const addUserSession = new rxjs.Subject();
const updateUserSession = new rxjs.Subject();
const deleteUserSession = new rxjs.Subject();


app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
   });

addUserSession.subscribe(
    (userData)=>{
        let userid = String(userData.sessionDetails.createdBy);
        db.collection('user').findOne({'user':userid } , (error , result) => {
            if(error) {
                console.log("someting went worng");
            }else{
                if(result === null) {
                    console.log('created user session');
                    db.collection('user').save({'user':userid,sessions:[userData]})
                }else{
                    result.sessions.push(userData);
                    console.log('updated user sessions');
                    db.collection('user').update({'user':userid} , result);
                }
            }
            
        })
    },
    err=>{
        console.log('some error happned while adding user session');
    },
    complete=>{
        console.log('add user session observale is not listning is completed');
    }
)

updateUserSession.subscribe(
    (userData)=>{
        let sessionid = String(userData.sessionDetails.sessionId);
        let userid = String(userData.sessionDetails.createdBy);  
        var promise = new Promise( (resolve,reject) => {
            console.log('deleting user session');
            db.collection('user').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
            setTimeout(()=>{
                resolve();
            },300)
        })
        promise.then(()=> {
            db.collection('user').findOne({'user': userid} , (err , result) => {
                if(err) {
                    console.log('someting went wrong');
                }else{
                        result.sessions.push(userData);
                        console.log("updated user session");
                        db.collection('user').update({'user':userid}, result)                    
                }
            })
        })
    },
    err=>{
        
    },
    complete=>{
        
    }
)


deleteUserSession.subscribe(
    (userData)=>{
        console.log(userData, "delete user session is called");
    },
    err=>{

    },
    complete=>{
        
    }
)
app.use(bodyParser.json());

MongoClient.connect('mongodb://mongodb:27017/', (err, client) => {
    if (err) { console.log("-----------------------------", err); }
    db = client.db('test-db');
    console.log('connected to data base');
    app.listen(port, () => {
        console.log("app is running on port :", port);
    });
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

                    addUserSession.next(req.body);
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
                    addUserSession.next(req.body);
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
        updateUserSession.next(req.body);
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
                    updateUserSession.next(req.body);
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
                        updateUserSession.next(req.body);
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
        deleteUserSession.next(req.body);
        setTimeout(()=>{
            resolve();
        },300)
    })

    promise.then(()=> {
        res.send('session deleted');
    })    
})

app.post("/user-sessions" , (req,res) => {
    let userid= String(req.body.userId);
    
    db.collection('user').findOne({'user':userid}, (err,result) => {
        if(err){
            console.log('someting went wrong');
        }else{
            res.send(JSON.stringify(result));
        }

    })

})


app.post('/getsessions', (req, res) => {
    let batchid = String(req.body.batchId);
    
    db.collection('quotes').findOne({'identifier':batchid} , (err, result) => {
        if(err){
            console.log('someting went wrong')
        }else{
            res.send(JSON.stringify(result));
        }
    })
    
})