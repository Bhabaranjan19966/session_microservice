const express = require('express');
const router = express.Router();
const rxjs = require('rxjs')
const batchUpdateReq = require ('../models/batch-requests').batchUpdateReq;
// const db = require('../server').db;
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = process.env.PORT || 8080;


MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, }, (err, client) => {
    if (err) { console.log("-----------------------------", err); }
    db = client.db('test-db');
    console.log('connected to data base');
    app.listen(port, () => {
        console.log("app is running on port :", port);
    });
})

router.post('/updateBatch', (req, res, next) => {
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
                                responseCode: "string",
                                result: {
                                    response: "string",
                                    date: result.ops[0]
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
                let updatedOps = {};
                updatedDelta = dataPackager(deltaBatchDetails);
                for (const key of Object.keys(result)) {
                    updatedOps[key] = updatedDelta[key];
                }
                delete updatedOps._id;
                db.collection('batches').updateOne({ _id: result._id }, { $set: updatedOps })
                    .then(result => {
                        const additionalDetail = {
                            result: result.message.documents[0],
                            request: {
                                type: 'POST',
                                url: `http://localhost:3000/updateBatch`
                            }
                        }
                        res.status(200).json(additionalDetail);
                    })
                    .catch(
                        err => {
                            res.status(500).json({
                                error: 'Update Error' + err
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

router.post('/fetchBatch', (req, res, next) => {
    const deltaBatchDetails = req.body.request;
    db.collection('batches').findOne({ 'batchId': deltaBatchDetails.batchId })
        .then(result => {
            if (result === null) {
                console.log(result);
                res.status(404).json({
                    error: 'Find Batch Result:', err
                });
            }
            else {
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
                        status: "success"
                    },
                    responseCode: "string",
                    result: {
                        response: "string",
                        date: result
                    }

                })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: 'Server Error:', err
            });
        })
})

function dataPackager(deltaBatchDetails) {
    responseObject = {};
    console.log(deltaBatchDetails);
    responseObject['batchId'] = deltaBatchDetails.batchId;
    if (deltaBatchDetails.mentorsAdded.length > 0) {
        console.log('Just checking');
        console.log(deltaBatchDetails.mentorsPresent);
        console.log(deltaBatchDetails.mentorsAdded);
        responseObject[deltaBatchDetails.createdById] = deltaBatchDetails.mentorsPresent.concat(deltaBatchDetails.mentorsAdded);
    }
    else {
        responseObject[deltaBatchDetails.createdById] = deltaBatchDetails.mentorsPresent;
    }
    responseObject[deltaBatchDetails.createdById] = deltaBatchDetails.mentorsPresent;
    for (mentor of deltaBatchDetails.mentorsPresent) {
        if (deltaBatchDetails.mentorWhoUpdated === mentor) {
            console.log(deltaBatchDetails.mentor);
            responseObject[mentor] = (deltaBatchDetails.mentor).concat(deltaBatchDetails.mentorsAdded);
        }
        else {
            responseObject[mentor] = [];
        }
    }
    console.log('This is the resp Object', responseObject);
    return responseObject;
}

module.exports = router;