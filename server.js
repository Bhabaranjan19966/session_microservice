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

//For batch update data packaging
const updateBatchDetails = new rxjs.Subject();

//Routes for batch management 
// const batchUpdateRoutes = require('./routes/batch-management');

//Morgan is for logging the HTTP Requests
const morgan = require('morgan');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// app.use('/batch', batchUpdateRoutes);
app.use(morgan('dev'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept,Authorization',
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT,POST,PATCH,DELETE,GET,PUT');
        return res.status(200).json({});
    }
    next();
});



addUserSession.subscribe(
    (userData) => {
        let userid = String(userData.sessionDetails.createdBy);
        db.collection('user').findOne({ 'user': userid }, (error, result) => {
            if (error) {
                console.log("someting went worng");
            } else {
                if (result === null) {
                    console.log('created user session');
                    db.collection('user').save({ 'user': userid, sessions: [userData] })
                } else {
                    result.sessions.push(userData);
                    console.log('updated user sessions');
                    db.collection('user').update({ 'user': userid }, result);
                }
            }

        })
    },
    err => {
        console.log('some error happned while adding user session');
    },
    complete => {
        console.log('add user session observale is not listning is completed');
    }
)

updateUserSession.subscribe(

    (userData) => {
        let sessionid = String(userData.sessionDetails.sessionId);
        let userid = String(userData.sessionDetails.createdBy);
        var promise = new Promise((resolve, reject) => {
            console.log('deleting user session');
            db.collection('user').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
            setTimeout(() => {
                resolve();
            }, 300)
        })

        promise.then(() => {
            db.collection('user').findOne({ 'user': userid }, (err, result) => {
                if (err) {
                    console.log('someting went wrong');
                } else {
                    result.sessions.push(userData);
                    console.log("updated user session");
                    db.collection('user').update({ 'user': userid }, result)
                }
            })
        })
    },
    err => {

    },
    complete => {

    }
)


deleteUserSession.subscribe(
    (userData) => {
        let sessionid = String(userData.sessionDetails.sessionId);
        db.collection('user').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
    },
    err => {

    },
    complete => {

    }
)
// MongoClient.connect('mongodb://mongodb:27017/', (err, client) => {
//     if (err) { console.log("-----------------------------", err); }
//     db = client.db('test-db');
//     console.log('connected to data base');
//     app.listen(port, () => {
//         console.log("app is running on port :", port);
//     });
// })
MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, }, (err, client) => {
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
                    res.json({ "value": 'data successfully inserted to the database' });
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
                        res.json({ "message": "cannot create session as you already have a session" });
                    } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.json({ "message": "cannot create session as you already have a session" });

                    } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                        val = true;
                        console.log("sending data");
                        res.json({ "message": "cannot create session as you already have a session" });

                    }

                })
                if (!val) {
                    req.body.sessionDetails.sessionId = sessionID;
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    addUserSession.next(req.body);
                    console.log("db updated");
                    res.json({ "data": "updated successfully" });
                }

            }
        }
    })
})



app.post('/update-session', (req, res) => {
    let sessionid = String(req.body.sessionDetails.sessionId);
    let batchid = String(req.body.identifier);

    var promise = new Promise((resolve, reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        updateUserSession.next(req.body);
        setTimeout(() => {
            resolve();
        }, 300)
    })

    promise.then(() => {
        console.log(sessionid, req.body.sessionDetails.sessionID);
        db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
            if (err) {
                console.log('error in performing operation', err);
            } else {

                if (result.sessions.length === 0) {
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    console.log("db updated");
                    deleteUserSession.next(req.body);
                    res.json({ 'data': 'sent data' });
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
                            res.json({ "message": "cannot create session as you already have a session" });
                        } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.json({ "message": "cannot create session as you already have a session" });

                        } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                            val = true;
                            console.log("sending data");
                            res.json({ "message": "cannot create session as you already have a session" });

                        }

                    })
                    if (!val) {
                        result.sessions.push(req.body);
                        db.collection('quotes').update({ "identifier": batchid }, result);
                        updateUserSession.next(req.body);
                        console.log("db updated");
                        res.json({ "data": "updated successfully" });
                    }


                }
            }

        })
    })

})


app.post('/delete-session', (req, res) => {
    let sessionid = String(req.body.sessionDetails.sessionId);

    var promise = new Promise((resolve, reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        deleteUserSession.next(req.body);
        setTimeout(() => {
            resolve();
        }, 300)
    })

    promise.then(() => {
        res.json({ "data": 'session deleted' });
    })
})

app.post("/user-sessions", (req, res) => {
    let userid = String(req.body.userId);

    db.collection('user').findOne({ 'user': userid }, (err, result) => {
        if (err) {
            console.log('someting went wrong');
        } else {
            res.json(result);
        }

    })

})


app.post('/getsessions', (req, res) => {
    let batchid = String(req.body.batchId);

    db.collection('quotes').findOne({ 'identifier': batchid }, (err, result) => {
        try {
            if (err) {
                console.log('someting went wrong')
                throw err;
            } else {
                console.log(result);
                res.json(result);
            }
        } catch (err) {
            console.log('invalid batch-id');
            res.json({ 'data': 'invalid batch id' });
        }
    })

})

app.post('/single-session', (req, res) => {
    let sessoinId = req.body.sessionId;
    db.collection('quotes').aggregate([
        {
            $project: {
                sessions: {
                    $filter: {
                        input: "$sessions",
                        as: "session",
                        cond: { $eq: ["$$session.sessionDetails.sessionId", sessoinId] }
                    }
                }
            }
        }
    ]).toArray((err, result) => {

        for (let i = 0; i < result.length; i++) {
            if (result[i].sessions !== null && result[i].sessions.length !== 0) {
                res.json(result[i].sessions[0]);
                break;
            }
        }
    })
})

app.post('/updateBatch', (req, res, next) => {
    const deltaBatchDetails = req.body.request;
    db.collection('batches').findOne({ 'batchId': deltaBatchDetails.batchId })
        .then(result => {
            if (result === null) {
                updatedDelta = dataPackager(deltaBatchDetails);
                db.collection('batches').insertOne(updatedDelta)
                    .then(
                        result => {
                            const additionalDetail = {
                                id: "string",
                                ver: "string",
                                ets: 0,
                                params: {
                                    msgid: "string",
                                    resmsgid: "string",
                                    err: null,
                                    err_msg: null,
                                    err_detail: null,
                                    status: "success"
                                },
                                responseCode: "HTTP 201",
                                result: {
                                    response: "Succesfully Posted Addition Batch Details",
                                    data: result.ops[0]
                                }
                            }
                            res.status(201).json(additionalDetail);
                        })
                    .catch(err => {
                        res.status(500).json({
                            error: 'New Post Error:' + err
                        });
                    })
            }
            else {
                updatedDelta = dataPackagerU(deltaBatchDetails, result);
                db.collection('batches').update({ _id: result._id }, updatedDelta)
                    .then(result => {
                        const additionalDetail = {
                            id: "string",
                            ver: "string",
                            ets: 0,
                            params: {
                                msgid: "string",
                                resmsgid: "string",
                                err: null,
                                err_msg: null,
                                err_detail: null,
                                status: "success"
                            },
                            responseCode: "HTTP 200",
                            result: {
                                response: "Successfully updated existing batch details",
                                data:updatedDelta
                            }
                        }
                        res.status(200).json(additionalDetail);
                    })
                    .catch(
                        err => {
                            res.status(204).json({
                                id: "string",
                                ver: "string",
                                ets: 0,
                                params: {
                                    msgid: "string",
                                    resmsgid: "string",
                                    err: null,
                                    err_msg: null,
                                    err_detail: null,
                                    status: "204 Not found"
                                },
                                responseCode: "HTTP 204",
                                result: {
                                    response: "Batch not found",
                                }
                            });
                        })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: 'Find Error' + err
            });
        })
})

app.post('/fetchBatch', (req, res, next) => {
    const deltaBatchDetails = req.body.request;
    db.collection('batches').findOne({ 'batchId': deltaBatchDetails.batchId })
        .then(result => {
            if (result !== null) {
                res.status(200).json({
                    id: "string",
                    ver: "string",
                    ets: 0,
                    params: {
                        msgid: "string",
                        resmsgid: "string",
                        err: null,
                        err_msg: null,
                        err_detail: null,
                        status: "200 Status Ok"
                    },
                    responseCode: "HTTP 200",
                    result: {
                        response: "Found Batch Details",
                        data: result
                    }

                })
            }else{
                res.status(404).json({
                    id: "string",
                    ver: "string",
                    ets: 0,
                    params: {
                        msgid: "string",
                        resmsgid: "string",
                        err: null,
                        err_msg: null,
                        err_detail: null,
                        status: "204 Not found"
                    },
                    responseCode: "HTTP 204",
                    result: {
                        response: "Batch not found",
                    }
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
})

function dataPackagerU(deltaBatchDetails, existingResObject) {
    responseObject = {};
    responseObject['courseId'] = deltaBatchDetails.courseId;
    responseObject['batchId'] = deltaBatchDetails.batchId;
    if (existingResObject !== null) {
        if (existingResObject[deltaBatchDetails.createdById] !== null) {
            allMentorsPresent = [...new Set(existingResObject[deltaBatchDetails.createdById].concat(deltaBatchDetails.mentorsAdded))];
            if (deltaBatchDetails.mentorsAdded.length > 0) {
                responseObject[deltaBatchDetails.createdById] = allMentorsPresent;
            }
            else {
                responseObject[deltaBatchDetails.createdById] = [...new Set(existingResObject[deltaBatchDetails.createdById])];
            }
        }
        if (deltaBatchDetails.mentorsDeleted.length > 0) {
            for (const mentorD of deltaBatchDetails.mentorsDeleted) {
                if (responseObject[deltaBatchDetails.createdById].indexOf(mentorD) !== -1) {
                    responseObject[deltaBatchDetails.createdById]
                        .splice(responseObject[deltaBatchDetails.createdById].indexOf(mentorD), 1);
                }
            }
        }
        if (responseObject[deltaBatchDetails.createdById].length > 0) {
            for (mentor of responseObject[deltaBatchDetails.createdById]) {
                if (deltaBatchDetails.mentorWhoUpdated === mentor) {
                    responseObject[mentor] = [...new Set(deltaBatchDetails.mentorsAdded.concat(existingResObject[mentor]))];
                    if (deltaBatchDetails.mentorsDeleted.length > 0) {
                        for (const mentorD of deltaBatchDetails.mentorsDeleted) {
                            if (responseObject[mentor].indexOf(mentorD) !== -1) {
                                responseObject[mentor]
                                    .splice(responseObject[mentor].indexOf(mentorD), 1);
                            }
                            delete responseObject[mentorD];
                        }
                    }
                }
                else {
                    responseObject[mentor] = [...new Set(existingResObject[mentor])];
                }
                if (deltaBatchDetails.mentorsDeleted.length > 0) {
                    for (const mentorD of deltaBatchDetails.mentorsDeleted) {
                        delete responseObject[mentorD];
                    }
                }
            }


        }
    }
    return responseObject;
}
function dataPackager(deltaBatchDetails) {
    responseObject = {};
    responseObject['courseId'] = deltaBatchDetails.courseId;
    responseObject['batchId'] = deltaBatchDetails.batchId;
    if (deltaBatchDetails.mentorsAdded.length > 0) {
        if (deltaBatchDetails.mentorsPresent.length > 0) {
            responseObject[deltaBatchDetails.createdById] = [...new Set(deltaBatchDetails.mentorsAdded.concat(deltaBatchDetails.mentorsPresent))];
        } else {
            responseObject[deltaBatchDetails.createdById] = deltaBatchDetails.mentorsAdded;
        }
    }
    for (mentor of responseObject[deltaBatchDetails.createdById]) {
        responseObject[mentor] = [];
        if (mentor === deltaBatchDetails.mentorWhoUpdated) {
            responseObject[mentor] = [...new Set(deltaBatchDetails.mentorsAdded)];
        }
    }
    return responseObject;
}



