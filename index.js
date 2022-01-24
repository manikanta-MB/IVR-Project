require('dotenv').config();
const Vonage = require('@vonage/server-sdk');
const express = require('express');
const morgan = require('morgan');

const app = express();
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY_PATH
});

app.use(morgan('tiny'));
app.use(express.json());

function getStreamAction(url){
  let streamAction = {
    "action": "stream",
    "streamUrl": [url],
    "bargeIn": true
  }
  return streamAction
}

function getInputAction(eventEndpoint){
  let inputAction = {
    "action": "input",
    "eventUrl": [
      "https://e882-36-255-87-146.ngrok.io/"+eventEndpoint
    ],
    "type": ["dtmf"],   
    "dtmf": {
      "maxDigits": 1
    }  
  }
  return inputAction
}

let baseUrl = "https://github.com/manikanta-MB/IVR-Audio-Recordings/blob/main/"
let baseInputAction = getInputAction("base_input")
let innerInputAction = getInputAction("inner_input")
let chosenLanguage = ""

app.get('/call', (req, res) => {
  vonage.calls.create({
    to: [{
      type: 'phone',
      number: req.query.to || process.env.TO_NUMBER
    }],
    from: {
      type: 'phone',
      number: process.env.VONAGE_NUMBER,
    },
    ncco: [
      getStreamAction(baseUrl + "baseinput/input%201.mp3?raw=true"),
      getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
      baseInputAction
    ]
  }, (err, resp) => {
    if (err)
      console.error(err);
    if (resp)
      console.log(resp);
  });
  res.send('<h1>Call was made</h1>');
});

app.post('/event', (req, res) => {
  console.log(req.body);
  res.status(200).send('');
});

// Level 1

app.post('/base_input',(req,res) => {
  let responseObject = req.body;
  let isTimedOut = responseObject.dtmf.timed_out
  if(isTimedOut){
    res.json([
      getStreamAction(baseUrl + "baseinput/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
      baseInputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    switch (entered_digit){
      case "1":
        chosenLanguage = "telugu"
        res.json([
          getStreamAction(baseUrl + "telugu/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "telugu/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
      case "2":
        chosenLanguage = "english"
        res.json([
          getStreamAction(baseUrl + "english/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "english/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
      case "3":
        chosenLanguage = "kannada"
        res.json([
          getStreamAction(baseUrl + "kannada/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "kannada/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
      case "4":
        chosenLanguage = "hindi"
        res.json([
          getStreamAction(baseUrl + "hindi/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "hindi/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
      case "8":
        res.json([
          getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
          baseInputAction
        ]);
        break;
      case "9":
        res.json([]);
        break;
      default:
        //baseUrl +  stream/sample%20record%201.mp3?raw=true
        res.json([
          getStreamAction(baseUrl + "baseinput/input%204.mp3?raw=true"),
          getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
          baseInputAction
        ]);
        break;
    }
  }
});

// Level 2
app.post('/inner_input',(req,res) => {
  let responseObject = req.body;
  let isTimedOut = responseObject.dtmf.timed_out
  if(isTimedOut){
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/input%202.mp3?raw=true"),
      innerInputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    // console.log("entered digit " + entered_digit);
    switch (entered_digit){
      case "1":
        console.log("entered");
        res.json([
          {
            "action": "stream",
            "streamUrl": [baseUrl + "ringtones/Idea.mp3?raw=true"]
          }
        ]);
        break;
      case "2":
        res.json([
          {
            "action": "stream",
            "streamUrl": [baseUrl + "ringtones/Airtel%20Mobile%20!%20Airtel.mp3?raw=true"]
          }
        ]);
        break;
      case "3":
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
      case "4":
        res.json([
          getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
          baseInputAction
        ]);
        break;
      case "5":
        res.json([]);
        break;
      default:
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/input%204.mp3?raw=true"),
          getStreamAction(baseUrl + chosenLanguage + "/input%202.mp3?raw=true"),
          innerInputAction
        ]);
        break;
    }
  }
});

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));
