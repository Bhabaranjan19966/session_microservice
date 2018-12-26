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


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
        let sessionid = String(userData.sessionDetails.sessionId);
        db.collection('user').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
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
                    res.json({"value":'data successfully inserted to the database'});
                })
            } else {

                const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartDate);
                const newSessionEndTime = new Date(req.body.sessionDetails.sessionStartDate);
                console.log(newSessionStartTime, newSessionEndTime);
                let sessionID = UUID();
                let val = false;
                result.sessions.map(session => {
                    console.log("inside map");
                    let eSessionStartTime = new Date(session.sessionDetails.sessionStartDate);
                    let eSessionEndTime = new Date(session.sessionDetails.sessionStartDate);
                    let eSessionId = session.sessionDetails.sessionId;
                    if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.json({"message":"cannot create session as you already have a session"});
                    } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.json({"message":"cannot create session as you already have a session"});

                    } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.json({"message":"cannot create session as you already have a session"});

                    }

                })
                if (!val) {
                    req.body.sessionDetails.sessionId = sessionID;
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    addUserSession.next(req.body);
                    console.log("db updated");
                    res.json({"data":"updated successfully"});
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
                    deleteUserSession.next(req.body);
                    res.json({'data':'sent data'});
                } else {
                    const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartDate);
                    const newSessionEndTime = new Date(req.body.sessionDetails.sessionStartDate);
                    console.log(newSessionStartTime, newSessionEndTime);
                    let val = false;
                    result.sessions.map(session => {
                        console.log("inside map");
                        let eSessionStartTime = new Date(session.sessionDetails.sessionStartDate);
                        let eSessionEndTime = new Date(session.sessionDetails.sessionStartDate);
                        // let eSessionId = session.sessionDetails.sessionId;
                        if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.json({"message":"cannot create session as you already have a session"});
                        } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.json({"message":"cannot create session as you already have a session"});
    
                        } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.json({"message":"cannot create session as you already have a session"});
    
                        }
    
                    })
                    if (!val) {
                        result.sessions.push(req.body);
                        db.collection('quotes').update({ "identifier": batchid }, result);
                        updateUserSession.next(req.body);
                        console.log("db updated");
                        res.json({"data":"updated successfully"});
                    }
    
    
                }
            }
    
        })
    })
   
})


app.post('/delete-session', (req,res) => {
    let sessionid = String(req.body.sessionDetails.sessionId);
    
    var promise = new Promise( (resolve,reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        deleteUserSession.next(req.body);
        setTimeout(()=>{
            resolve();
        },300)
    })

    promise.then(()=> {
        res.json({"data":'session deleted'});
    })    
})

app.post("/user-sessions" , (req,res) => {
    let userid= String(req.body.userId);
    
    db.collection('user').findOne({'user':userid}, (err,result) => {
        if(err){
            console.log('someting went wrong');
        }else{
            res.json(result);
        }

    })

})


app.post('/getsessions', (req, res) => {
    let batchid = String(req.body.batchId);
    
    db.collection('quotes').findOne({'identifier':batchid} , (err, result) => {
    try{
            if(err){
            console.log('someting went wrong')
            throw err;
        }else{
            console.log(result);
            res.json(result);
        }
    }catch(err){
        console.log('invalid batch-id');
        res.json({'data':'invalid batch id'});
    }
    })
    
})

app.post('/single-session', (req,res) =>{
    let sessoinId= req.body.sessionId;
    db.collection('quotes').aggregate([
        {
           $project: {
              sessions: {
                 $filter: {
                    input: "$sessions",
                    as: "session",
                    cond: { $eq: [ "$$session.sessionDetails.sessionId", sessoinId ] }
                 }
              }
           }
        }
     ]).toArray( (err ,result) => {
         
        for(let i = 0 ; i< result.length ; i++){
            if(result[i].sessions !== null && result[i].sessions.length !==0){
                res.json(result[i].sessions[0]);
                break;
            }
        }   
     })
})