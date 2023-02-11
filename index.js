require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


const mongo = require('mongodb');
const mongoose= require('mongoose');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const validUrl = require('valid-url');
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended:false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});



const uri = process.env.MONGO_URI;
/**
 * useNewUrlParser: 
 * This option is used to opt in to using the 
 * new MongoDB driver's URL parser instead of the legacy parser. 
 * The new parser handles certain characters in a URL differently than the legacy parser, 
 * and is required for some MongoDB connection string features.

useUnifiedTopology: 
This option is used to opt in to using the new MongoDB driver's topology engine. 
The topology engine handles the low-level details of connecting to a MongoDB deployment, 
and is required for some new features and behaviors.

serverSelectionTimeoutMS: 
This option specifies how long to wait for a server to respond when selecting a server for a new connection. 
If a server is not selected within the specified time, an error will be thrown.
 */
mongoose.connect(uri,{
                        useNewUrlParser:true,
                        useUnifiedTopology:true,
                        serverSelectionTimeoutMS: 5000,

})

const connection = mongoose.connection;
/*
on(eventName, listener): 
The on method adds a listener function to the event emitter for the specified event. 
The listener function will be called every time the event is emitted.

once(eventName, listener): The once method adds a one-time 
listener function to the event emitter for the specified event. 
The listener function will be called only once, the first time the event is emitted. 
After that, it will be removed from the list of listeners for that event.
*/
connection.on('error',console.error.bind(console,"connection error"));
connection.once('open',()=>{
  console.log("connections is successfull")
}) 

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url:String,
  short_url:String,
})

const URL = mongoose.model("URL",urlSchema);

app.post('/api/shorturl/',async(req,res)=>{
    const url = req.body.url; 
    const urlShort = shortId.generate();

    console.log(req.body,url,urlShort);
    if(!validUrl.isWebUri(url)){
      return res.json({error: 'invalid url' });
    }

    try{
      let findOne = await URL.findOne({original_url:url});
      console.log(findOne);
      if(findOne){
        return res.json({original_url: findOne.original_url, short_url: findOne.short_url});
      }else{

      findOne = new URL({original_url:url, short_url:urlShort});
      await findOne.save();
      return res.json({original_url:url,short_url:urlShort});
      }
    }catch(err){
      console.log(err);
      return res.status(500).send({error: 'server error'});
    }


})

app.get('/api/shorturl/:short_url',async (req,res)=>{
  try{
    console.log(req.params)
    const urlParams = await URL.findOne({short_url:req.params.short_url});
    console.log(urlParams.short_url,urlParams.original_url);
    if(urlParams){ return res.redirect(urlParams.original_url)}
    return res.status(404).json({error:"not found"});

  }catch(err){
    return res.status(500).json({error:'server error'});
  }
})












app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
