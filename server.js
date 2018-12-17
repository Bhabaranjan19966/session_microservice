const express = require('express');
const app = express();
const port = process.env.PORT||8080;

app.get('/getdata', (req,res) => {
    res.send("data is being received");
})

app.listen(port,()=>{
console.log("app is running on port :" , port);
});
