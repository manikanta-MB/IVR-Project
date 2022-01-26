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

function getInputAction(eventEndpoint,speechInput = false){
  let remoteUrl = "https://3b72-36-255-87-146.ngrok.io/"
  if(speechInput){
    let inputAction = {
      "action":"input",
      "eventUrl": [
        remoteUrl+eventEndpoint
      ],
      "type": ["speech"],
      "speech": {
        "saveAudio": true,
        "language": "en-IN",
        "startTimeout": 4,
      }
    }
    return inputAction
  }
  else{
    let inputAction = {
      "action": "input",
      "eventUrl": [
        remoteUrl+eventEndpoint
      ],
      "type": ["dtmf"],   
      "dtmf": {
        "maxDigits": 1
      }  
    }
    return inputAction
  }
}

let baseUrl = "https://github.com/manikanta-MB/IVR-Audio-Recordings/blob/main/"
let baseInputAction = getInputAction("base_input")
let infoInputAction = getInputAction("info_input")
let enterInfoInputAction = getInputAction("enter_info",true)
let cofirmInfoInputAction = getInputAction("confirm_info")
let resultInfoInputAction = getInputAction("result_info")
let chosenLanguage = ""
let chosenInfo = ""
let spokenData = ""

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
          getStreamAction(baseUrl + "telugu/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
      case "2":
        chosenLanguage = "english"
        res.json([
          getStreamAction(baseUrl + "english/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "english/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
      case "3":
        chosenLanguage = "kannada"
        res.json([
          getStreamAction(baseUrl + "kannada/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "kannada/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
      case "4":
        chosenLanguage = "hindi"
        res.json([
          getStreamAction(baseUrl + "hindi/input%201.mp3?raw=true"),
          getStreamAction(baseUrl + "hindi/info/input%202.mp3?raw=true"),
          infoInputAction
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
app.post('/info_input',(req,res) => {
  let responseObject = req.body;
  let isTimedOut = responseObject.dtmf.timed_out
  if(isTimedOut){
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/info/input%202.mp3?raw=true"),
      infoInputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    switch (entered_digit){
      case "1":
        chosenInfo = "yn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/yn.mp3?raw=true"),
          enterInfoInputAction
        ])
        break;
      case "2":
        chosenInfo = "fn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/fn.mp3?raw=true"),
          enterInfoInputAction
        ])
        break;
      case "3":
        chosenInfo = "mn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/mn.mp3?raw=true"),
          enterInfoInputAction
        ])
        break;
      case "4":
        chosenInfo = "ad"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/ad.mp3?raw=true"),
          enterInfoInputAction
        ])
        break;
      case "5":
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
      case "6":
        res.json([
          getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
          baseInputAction
        ]);
        break;
      case "7":
        res.json([]);
        break;
      default:
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/input%204.mp3?raw=true"),
          getStreamAction(baseUrl + chosenLanguage + "/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
    }
  }
});

// Level 3
app.post("/enter_info",(req,res) => {
  let requestObj = req.body;
  
  if(requestObj.speech.timeout_reason == 'start_timeout'){
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/enter info/no%20input.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/enter info/" + chosenInfo + ".mp3?raw=true"),
      enterInfoInputAction
    ]);
  }
  else{
    spokenData = requestObj.speech.results[0].text
    console.log(spokenData);
    // let recordingUrl = requestObj.speech.recording_url;
    // console.log(recordingUrl);
    // vonage.files.save(recordingUrl, 'test.mp3', (err, res) => {
    //   if(err) { console.error(err); }
    //   else {
    //       console.log(res);
    //   }
    // });
    res.json([
      {
        "action":"stream",
        "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"]
      },
      {
        "action":"talk",
        "text":spokenData,
      },
      getStreamAction(baseUrl + chosenLanguage + "/confirm info/soc.mp3?raw=true"),
      cofirmInfoInputAction
    ]);
  }
});

// Level 4

app.post("/confirm_info",(req,res) => {
  let requestObject = req.body;
  let isTimedOut = requestObject.dtmf.timed_out
  if(isTimedOut){
    res.json([
      {
        "action":"stream",
        "streamUrl":[baseUrl + chosenLanguage + "/input%203.mp3?raw=true"]
      },
      {
        "action":"stream",
        "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"]
      },
      {
        "action":"talk",
        "text":spokenData,
      },
      getStreamAction(baseUrl + chosenLanguage + "/confirm info/soc.mp3?raw=true"),
      cofirmInfoInputAction
    ]);
  }
  else{
    let entered_digit = requestObject.dtmf.digits;
    switch(entered_digit){
      case "1":
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/result info/" + chosenInfo + " saved.mp3?raw=true"]
          },
          getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
          resultInfoInputAction
        ]);
        break;
      case "2":
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/result info/" + chosenInfo + " cancelled.mp3?raw=true"]
          },
          getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
          resultInfoInputAction
        ]);
        break;
      default:
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/input%204.mp3?raw=true"]
          },
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"]
          },
          {
            "action":"talk",
            "text":spokenData,
          },
          getStreamAction(baseUrl + chosenLanguage + "/confirm info/soc.mp3?raw=true"),
          cofirmInfoInputAction
        ]);
        break;
    }
  }
});

// Level 5

app.post("/result_info",(req,res) => {
  let requestObject = req.body;
  let isTimedOut = requestObject.dtmf.timed_out
  if(isTimedOut){
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
      resultInfoInputAction
    ]);
  }
  else{
    let entered_digit = requestObject.dtmf.digits;
    switch(entered_digit){
      case "1":
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/info/input%202.mp3?raw=true"),
          infoInputAction
        ]);
        break;
      case "2":
        res.json([]);
        break;
      default:
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/input%204.mp3?raw=true"),
          getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
          resultInfoInputAction
        ]);
        break;
    }
  }
});

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));
