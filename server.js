const express = require('express');
const app = express();
const port = process.env.PORT||8080;
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
var db;
var counter=0;

MongoClient.connect('mongodb://mongodb:27017/',(err,client)=>{
    if(err){console.log("-----------------------------",err);}
    
       db = client.db('test-db');
       console.log('connected to data base');
       app.listen(port,()=>{
        console.log("app is running on port :" , port);
        });
})


app.get('/getdata/:batchid', (req,res) => {
    console.log(req.params.batchid);
    res.json({"data":3});
})

app.post('/create-session', (req , res) => {
    console.log('request is being received-------------');
    db.collection('quotes').save({batch:req.params.batch-id, coun: counter},(err, result) => {
            if(err){
                console.log(err);
            }
                counter++;
                res.send('/getdata');
            
    })
})


