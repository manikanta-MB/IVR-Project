require('dotenv').config();
const Vonage = require('@vonage/server-sdk');
const express = require('express');
const morgan = require('morgan');
const client = require("./database");

const app = express();
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY_PATH
});

app.use(morgan('tiny'));
app.use(express.json());

// Helper Functions

function getStreamAction(url,needBargeIn=true){
  let streamAction = {
    "action": "stream",
    "streamUrl": [url],
    "level": 1,
    "bargeIn": needBargeIn
  }
  return streamAction
}

function getInputAction(eventEndpoint,speechInput = false){
  let remoteUrl = "https://210a-182-74-35-130.ngrok.io/"
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

function create_entry_if_not_exists(){
  client.query(`select mobile_number from user_info where mobile_number = $1`,[to], (err,result) => {
      if(err){
          console.log(err);
      }
      else{
          if(result.rowCount == 0){
            client.query(`insert into user_info (mobile_number) values ($1)`,[to], (err,result) => {
                if(err){
                    console.log(err);
                }
                else{
                    console.log("entry created");
                }
            });
          }
          else{
            console.log("entry already existed.");
          }
      }
  });
}

function initializeConversationEntry(uuid,beginTime){
  client.query(`insert into conversation (uuid,to_mobile_number,begin_time) values ($1,$2,$3) RETURNING *`,
    [uuid,to,beginTime], 
    (err,result) => {
        if(err){
            console.log(err);
        }
        else{
            console.log("conversation Initialized");
            console.log(result.rows);
        }
    });
}

function updateData(){
  let col1 = "", col2 = "";
  switch(chosenInfo){
    case "yn":
      col1 = "your_name_text"
      col2 = "your_name_audio_url"
      break;
    case "fn":
      col1 = "father_name_text"
      col2 = "father_name_audio_url"
      break;
    case "mn":
      col1 = "mother_name_text"
      col2 = "mother_name_audio_url"
      break;
    case "ad":
      col1 = "address_text"
      col2 = "address_audio_url"
      break;
  }
  client.query(`update user_info set ${col1} = $1, ${col2} = $2 where mobile_number = $3 RETURNING *`,
    [spokenData,recordingPath,to],
    (err,result) => {
      if(err){
        console.log(err);
      }
      else{
        console.log(result.rows);
      }
  });
}

function updateConversationEntry(uuid,endTime){
  client.query(`update conversation set end_time = $1, actions_by_user = $2 where uuid = $3 RETURNING *`,
    [endTime,JSON.stringify(actionsByUser),uuid],
    (err,result) => {
      if(err){
        console.log(err);
      }
      else{
        console.log(result.rows);
      }
  });
}

// Global Variables

let baseUrl = "https://github.com/manikanta-MB/IVR-Audio-Recordings/blob/main/"
let baseInputAction = getInputAction("base_input")
let infoInputAction = getInputAction("info_input")
let enterInfoInputAction = getInputAction("enter_info",true)
let cofirmInfoInputAction = getInputAction("confirm_info")
let resultInfoInputAction = getInputAction("result_info")
let chosenLanguage = ""
let chosenInfo = ""
let spokenData = ""
let recordingPath = ""
let recordingUrl = ""
let to = ""
let actionsByUser = []

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
  let status = req.body.status;
  if(status == 'answered'){
    actionsByUser = [];
    to = req.body.to;
    let uuid = req.body.conversation_uuid;
    let beginTime = req.body.timestamp;
    initializeConversationEntry(uuid,beginTime);
    create_entry_if_not_exists();
  }
  else if(status == 'completed'){
    let endTime = req.body.timestamp;
    let uuid = req.body.conversation_uuid;
    updateConversationEntry(uuid,endTime);
  }
  res.status(200).send('');
});

// Level 1

app.post('/base_input',(req,res) => {
  let responseObject = req.body;
  let isTimedOut = responseObject.dtmf.timed_out
  if(isTimedOut){
    actionsByUser.push({"timeOut":true});
    res.json([
      getStreamAction(baseUrl + "baseinput/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + "baseinput/input%202.mp3?raw=true"),
      baseInputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    actionsByUser.push({"pressed":entered_digit});
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
    actionsByUser.push({"timeOut":true});
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/info/input%202.mp3?raw=true"),
      infoInputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    actionsByUser.push({"pressed":entered_digit});
    switch (entered_digit){
      case "1":
        chosenInfo = "yn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/yn.mp3?raw=true",false),
          enterInfoInputAction
        ])
        break;
      case "2":
        chosenInfo = "fn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/fn.mp3?raw=true",false),
          enterInfoInputAction
        ])
        break;
      case "3":
        chosenInfo = "mn"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/mn.mp3?raw=true",false),
          enterInfoInputAction
        ])
        break;
      case "4":
        chosenInfo = "ad"
        res.json([
          getStreamAction(baseUrl + chosenLanguage + "/enter info/ad.mp3?raw=true",false),
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
  console.log("Enter Info");
  console.log(requestObj);

  if(requestObj.speech.timeout_reason == 'start_timeout'){
    actionsByUser.push({"timeOut":true});
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/enter info/no%20input.mp3?raw=true",false),
      getStreamAction(baseUrl + chosenLanguage + "/enter info/" + chosenInfo + ".mp3?raw=true",false),
      enterInfoInputAction
    ]);
  }
  else if(requestObj.speech.hasOwnProperty("error")){
    actionsByUser.push({"unableToAnalyzeVoice":true});
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/enter info/error.mp3?raw=true",false),
      getStreamAction(baseUrl + chosenLanguage + "/enter info/" + chosenInfo + ".mp3?raw=true",false),
      enterInfoInputAction
    ]);
  }
  else{
    if(requestObj.speech.results && requestObj.speech.results.length > 0){
      spokenData = requestObj.speech.results[0].text
      console.log(spokenData);
      recordingUrl = requestObj.speech.recording_url;
      console.log(recordingUrl);
      recordingPath = "Voice Data/"+to+"_"+chosenInfo+".mp3"

      actionsByUser.push({"spokenData":spokenData});
      actionsByUser.push({"recordingUrl":recordingUrl});
      actionsByUser.push({"recordingPath":recordingPath});

      res.json([
        {
          "action":"stream",
          "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"],
          "level": 1
        },
        {
          "action":"talk",
          "text":spokenData,
          "language":"en-IN",
          "style": 0,
          "level":1
        },
        getStreamAction(baseUrl + chosenLanguage + "/confirm info/soc.mp3?raw=true"),
        cofirmInfoInputAction
      ]);
    }
    else{
      res.json([]);
    }
  }
});

// Level 4

app.post("/confirm_info",(req,res) => {
  let requestObject = req.body;
  let isTimedOut = requestObject.dtmf.timed_out
  if(isTimedOut){
    actionsByUser.push({"timeOut":true});
    res.json([
      {
        "action":"stream",
        "streamUrl":[baseUrl + chosenLanguage + "/input%203.mp3?raw=true"],
        "level": 1
      },
      {
        "action":"stream",
        "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"],
        "level": 1
      },
      {
        "action":"talk",
        "text":spokenData,
        "language":"en-IN",
        "style": 0,
        "level": 1
      },
      getStreamAction(baseUrl + chosenLanguage + "/confirm info/soc.mp3?raw=true"),
      cofirmInfoInputAction
    ]);
  }
  else{
    let entered_digit = requestObject.dtmf.digits;
    actionsByUser.push({"pressed":entered_digit});
    switch(entered_digit){
      case "1":
        vonage.files.save(recordingUrl, recordingPath, (err, res) => {
          if(err) { console.error(err); }
          else {
              console.log(res + " saved to file system.");
          }
        });
        updateData();
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/result info/" + chosenInfo + " saved.mp3?raw=true"],
            "level": 1
          },
          getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
          resultInfoInputAction
        ]);
        break;
      case "2":
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/result info/" + chosenInfo + " cancelled.mp3?raw=true"],
            "level": 1
          },
          getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
          resultInfoInputAction
        ]);
        break;
      default:
        res.json([
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/input%204.mp3?raw=true"],
            "level": 1
          },
          {
            "action":"stream",
            "streamUrl":[baseUrl + chosenLanguage + "/confirm info/" + chosenInfo + ".mp3?raw=true"],
            "level": 1
          },
          {
            "action":"talk",
            "text":spokenData,
            "language":"en-IN",
            "style": 0,
            "level": 1
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
    actionsByUser.push({"timeOut":true});
    res.json([
      getStreamAction(baseUrl + chosenLanguage + "/input%203.mp3?raw=true"),
      getStreamAction(baseUrl + chosenLanguage + "/result info/callback.mp3?raw=true"),
      resultInfoInputAction
    ]);
  }
  else{
    let entered_digit = requestObject.dtmf.digits;
    actionsByUser.push({"pressed":entered_digit});
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
