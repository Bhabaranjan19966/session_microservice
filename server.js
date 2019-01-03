const express = require('express');
const app = express();
const rxjs = require('rxjs')
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const UUID = require('uuid/v4');
const Validate = require('./validation')
const port = process.env.PORT || 8080;
let db;

let responseSample= {
    id: "string",
    ver: "string",
    ets: 0,
    params: {
        msgid: "string",
        resmsgid: "string",
        err: null,
        err_msg: null,
        err_detail: null,
        status: "string"
    },
    responseCode: "string",
    result: {
        response: "string",
        data: ""
    }

}
const addUserSession = new rxjs.Subject();
const updateUserSession = new rxjs.Subject();
const deleteUserSession = new rxjs.Subject();

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
                ////console.log("someting went worng");
            } else {
                if (result === null) {
                    ////console.log('created user session');
                    db.collection('user').save({ 'user': userid, sessions: [userData] })
                } else {
                    result.sessions.push(userData);
                    //console.log('updated user sessions 1');
                    db.collection('user').update({ 'user': userid }, result);
                }
            }

        })
    },
    err => {
        //console.log('some error happned while adding user session');
    },
    complete => {
        //console.log('add user session observale is not listning is > completed');
    }
)

updateUserSession.subscribe(

    (userData) => {
        let sessionid = String(userData.sessionDetails.sessionId);
        let userid = String(userData.sessionDetails.createdBy);
        var promise = new Promise((resolve, reject) => {
            //console.log('deleting user session');
            db.collection('user').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });

            resolve();

        })

        promise.then(() => {
            db.collection('user').findOne({ 'user': userid }, (err, result) => {
                if (err) {
                    //console.log('someting went wrong');
                } else {
                    result.sessions.push(userData);
                    //console.log("updated user session 2");
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
MongoClient.connect('mongodb://mongodb:27017/', (err, client) => {
    if (err) { //console.log("-----------------------------", err); 
}
    db = client.db('test-db');
    console.log('Connected to data base');
    app.listen(port, () => {
        console.log("Server is running on port :", port);
    });
})
// MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, }, (err, client) => {
//     if (err) { //console.log("-----------------------------", err); 
// }
//     db = client.db('test-db');
//     //console.log('connected to data base');
//     app.listen(port, () => {
//         //console.log("app is running on port :", port);
//     });

// })

app.post('/create-session', (req, res) => {
    if (!Validate.validateCreateSession(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }
    let batchid = String(req.body.identifier);
    //console.log(batchid);

    db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
        if (err) {
            return res.json(err);

        } else {
            if (result === null) {
                let sessionID = UUID();
                req.body.sessionDetails.sessionId = sessionID;
                db.collection('quotes').save({ 'identifier': batchid, "sessions": [req.body] }, (err, result) => {
                    if (err) {
                        //console.log(err);
                    }
                    addUserSession.next(req.body);
                    res.json({ "message": 'data successfully inserted to the database', sessionId: sessionID });
                })
            } else {

                const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartDate);
                const newSessionEndTime = new Date(req.body.sessionDetails.sessionEndDate);
                //console.log(newSessionStartTime, newSessionEndTime);
                let sessionID = UUID();
                let val = false;
                result.sessions.map(session => {
                    //console.log("inside map");
                    let eSessionStartTime = new Date(session.sessionDetails.sessionStartDate);
                    let eSessionEndTime = new Date(session.sessionDetails.sessionEndDate);
                    let eSessionId = session.sessionDetails.sessionId;
                    if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                        val = true;
                        //console.log("sending data");
                        res.json({ "message": "cannot create session as you already have a session" });
                    } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                        val = true;
                        //console.log("sending data");
                        res.json({ "message": "cannot create session as you already have a session" });

                    } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                        val = true;
                        //console.log("sending data");
                        res.json({ "message": "cannot create session as you already have a session" });

                    }

                })
                if (!val) {
                    req.body.sessionDetails.sessionId = sessionID;
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    addUserSession.next(req.body);
                    //console.log("db updated");
                    res.json({ "message": 'data successfully inserted to the database', sessionId: sessionID });
                }

            }
        }
    })
})


app.post('/update-session', (req, res) => {

    if (!Validate.validateUpdateSession(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }


    let sessionid = String(req.body.sessionDetails.sessionId);
    let batchid = String(req.body.identifier);

    var promise = new Promise((resolve, reject) => {
        db.collection('quotes').update({}, { $pull: { sessions: { 'sessionDetails.sessionId': sessionid } } }, { multi: true });
        deleteUserSession.next(req.body);
        setTimeout(() => {
            resolve();
        }, 300)
    })

    promise.then(() => {
        //console.log(sessionid, req.body.sessionDetails.sessionID);
        db.collection('quotes').findOne({ "identifier": batchid }, (err, result) => {
            if (err) {
                //console.log('error in performing operation', err);
            } else {

                if (result.sessions.length === 0) {
                    result.sessions.push(req.body);
                    db.collection('quotes').update({ "identifier": batchid }, result);
                    //console.log("db updated");
                    updateUserSession.next(req.body);
                    res.json({ "message": "updated successfully", "responseCode": 200 });
                } else {
                    const newSessionStartTime = new Date(req.body.sessionDetails.sessionStartDate);
                    const newSessionEndTime = new Date(req.body.sessionDetails.sessionEndDate);
                    //console.log(newSessionStartTime, newSessionEndTime);
                    let val = false;
                    result.sessions.map(session => {
                        //console.log("inside map");
                        let eSessionStartTime = new Date(session.sessionDetails.sessionStartDate);
                        let eSessionEndTime = new Date(session.sessionDetails.sessionEndDate);
                        // let eSessionId = session.sessionDetails.sessionId;
                        if (!val && newSessionEndTime >= eSessionStartTime && newSessionEndTime <= eSessionEndTime) {
                            val = true;
                            //console.log("sending data");
                            res.json({ "message": "cannot create session as you already have a session" });
                        } else if (!val && newSessionStartTime >= eSessionStartTime && newSessionStartTime <= eSessionEndTime) {
                            val = true;
                            //console.log("sending data");
                            res.json({ "message": "cannot create session as you already have a session" });

                        } else if (!val && newSessionStartTime <= eSessionStartTime && newSessionEndTime >= eSessionEndTime) {
                            val = true;
                            //console.log("sending data");
                            res.json({ "message": "cannot create session as you already have a session" });

                        }

                    })
                    if (!val) {
                        result.sessions.push(req.body);
                        db.collection('quotes').update({ "identifier": batchid }, result);
                        updateUserSession.next(req.body);
                        //console.log("db updated");
                        res.json({ "message": "updated successfully", "responseCode": 200 });
                    }


                }
            }

        })
    })

})


app.post('/delete-session', (req, res) => {

    if (!Validate.validateDeleteSession(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }

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

    if (!Validate.validateUserSessions(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }

    let userid = String(req.body.userId);

    db.collection('user').findOne({ 'user': userid }, (err, result) => {
        if (err) {
            //console.log('someting went wrong');
        } else {
            //console.log(JSON.stringify(result), " sending user session details")
            res.json(result);
        }

    })

})


app.post('/getsessions', (req, res) => {


    if (!Validate.validateGetSessions(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }


    let batchid = String(req.body.batchId);

    db.collection('quotes').findOne({ 'identifier': batchid }, (err, result) => {
        try {
            if (err) {
                //console.log('someting went wrong')
                throw err;
            } else {
                //console.log(result);
                res.json(result);
            }
        } catch (err) {
            //console.log('invalid batch-id');
            res.json({ 'data': 'invalid batch id' });
        }
    })

})

app.post('/single-session', (req, res) => {

    if (!Validate.validateSingleSession(req.body)) {
        return res.json({
            "error": "Missing fields",
            "responseCode": 400
        })
    }



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

app.post('/update-batch', (req, res, next) => {
    if(Validate.validateUpdateBatch(req.body)){
        const deltaBatchDetails = req.body.request;
        db.collection('batches').findOne({ 'batchId': deltaBatchDetails.batchId })
        .then(result => {
            if (result === null) {
                updatedDelta = dataPackager(deltaBatchDetails);
                db.collection('batches').insertOne(updatedDelta)
                    .then(
                        result => {
                            responseSample.responseCode= "201";
                            responseSample.result.response="Succesfully Posted Addition Batch Details";
                            responseSample.result.data = result.ops[0];
                            res.status(201).json(responseSample);
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
                        responseSample.responseCode= "200";
                        responseSample.result.response="Successfully updated existing batch details";
                        responseSample.result.data = updatedDelta;
                        res.status(200).json(responseSample);
                    })
                    .catch(
                        err => {
                            responseSample.responseCode="204";
                            responseSample.result.response="No additional Batch Details found";
                            res.status(204).json(responseSample);
                        })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: 'Find Error' + err
            });
        })
    }else{
        responseSample.responseCode="400";
        responseSample.result.response="Bad Request, Check JSON document format";
        res.status(400).json(responseSample);
    }
})

app.post('/fetch-batch', (req, res, next) => {
    if(Validate.validateFetchBatch(req.body)){
    const deltaBatchDetails = req.body.request;
    db.collection('batches').findOne({ 'batchId': deltaBatchDetails.batchId })
        .then(result => {
            if (result !== null) {
                responseSample.responseCode= "200";
                responseSample.result.response="Found Batch Details";
                responseSample.result.data = result;
                res.status(200).json(responseSample);
            }else{
                responseSample.responseCode= "404";
                responseSample.result.response="Batch not found";
                res.status(404).json(responseSample)
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
    }else{
        responseSample.responseCode="400";
        responseSample.result.response="Bad Request, Check JSON document format";
        res.status(400).json(responseSample);
    }
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
    }else{
        if (deltaBatchDetails.mentorsPresent.length > 0) {
            responseObject[deltaBatchDetails.createdById] = [...new Set(deltaBatchDetails.mentorsPresent)];
        } else {
            responseObject[deltaBatchDetails.createdById]=[]        
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
        for (mentor of responseObject[deltaBatchDetails.createdById]) {
            responseObject[mentor] = [];
            if (mentor === deltaBatchDetails.mentorWhoUpdated) {
                responseObject[mentor] = [...new Set(deltaBatchDetails.mentorsAdded)];
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
        }
    if (deltaBatchDetails.mentorsDeleted.length > 0) {
        for (const mentorD of deltaBatchDetails.mentorsDeleted) {
            delete responseObject[mentorD];
        }
    }
    return responseObject;
}



