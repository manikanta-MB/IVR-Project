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
let talkAction = {
                  "action": "talk",
                  "text": "welcome to ivr system, press 1 for telugu, press 2 for english, press 3 for kannada, press 4 for hindi, press 8 to repeat, press 9 to exit",
                  "bargeIn": true
                }
let inputAction = {
                    "action": "input",
                    "eventUrl": [
                      "https://d110-182-74-35-130.ngrok.io/ivr"
                    ],
                    "type": ["dtmf"],   
                    "dtmf": {
                      "maxDigits": 1
                    }  
                  }


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
      talkAction,
      inputAction
    ]
  }, (err, resp) => {
    if (err)
      console.error(err);
    if (resp)
      console.log(resp);
  });
  res.json('ok');
});

app.post('/event', (req, res) => {
  console.log(req.body);
  res.status(200).send('');
});

app.post('/ivr',(req,res) => {
  let responseObject = req.body;
  let isTimedOut = responseObject.dtmf.timed_out
  if(isTimedOut){
    let timedoutTalkAction = { ...talkAction };
    timedoutTalkAction["text"] = "you didn't enter any digit, please enter any digit or to repeat press 8"
    res.json([
      timedoutTalkAction,
      inputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    let responseTalkAction = {
      "action":"talk",
      "text":"you have choosen "
    }
    switch (entered_digit){
      case "1":
        responseTalkAction["text"] += "telugu";
        res.json([responseTalkAction]);
        break;
      case "2":
        responseTalkAction["text"] += "english";
        res.json([responseTalkAction]);
        break;
      case "3":
        responseTalkAction["text"] += "kannada";
        res.json([responseTalkAction]);
        break;
      case "4":
        responseTalkAction["text"] += "hindi";
        res.json([responseTalkAction]);
        break;
      case "8":
        res.json([
          talkAction,
          inputAction
        ]);
        break;
      case "9":
        res.json([]);
        break;
      default:
        // https://github.com/manikanta-MB/IVR-Audio-Recordings/blob/main/stream/sample%20record%201.mp3?raw=true
        res.json([
          {
            "action": "stream",
            "streamUrl": ["https://github.com/manikanta-MB/IVR-Audio-Recordings/blob/main/stream/sample%20record%201.mp3?raw=true"]
          }
        ]);
        break;
    }
  }
});

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));
