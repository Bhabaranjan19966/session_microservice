const express = require('express');
const app = express();
const port = process.env.PORT||8080;
const MongoClient = require('mongodb').MongoClient;
const db;
const couner=0;

MongoClient.connect('mongo://27017',(err,client)=>{
    if(err){console.log(err);}
     else{
       db=client.connect('test-db');
       console.log('connected to data base');
    }     
})


app.get('/getdata', (req,res) => {
    res.send("data is being received");
    res.redirect('/data')
})

app.post("/data", (req , res) => {
    db.collection('quotes').save({coun: counter},(err, result) => {
            if(err){
                console.log(err);
            }
            else{
                counter++;
                res.send('saved to data base');
            }
    })
})

app.listen(port,()=>{
console.log("app is running on port :" , port);
});
