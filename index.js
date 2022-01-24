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

let inputAction = {
                    "action": "input",
                    "eventUrl": [
                      "https://2c2f-182-74-35-130.ngrok.io/ivr"
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
      {
        "action": "talk",
        "text": "welcome to ivr system, press 1 for telugu, press 2 for english, press 3 for kannada, press 4 for hindi, press 8 to repeat, press 9 to exit",
        "bargeIn": true
      },
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
    res.json([
      {
        "action": "talk",
        "text":"you didn't enter any digit, please enter any digit, to repeat press 8",
        "bargeIn": true
      },
      inputAction
    ])
  }
  else{
    let entered_digit = responseObject.dtmf.digits;
    let response = {
      "action":"talk",
      "text":"you have choosen "
    }
    switch (entered_digit){
      case "1":
        response["text"] += "telugu";
        res.json([response]);
        break;
      case "2":
        response["text"] += "english";
        res.json([response]);
        break;
      case "3":
        response["text"] += "kannada";
        res.json([response]);
        break;
      case "4":
        response["text"] += "hindi";
        res.json([response]);
        break;
      case "8":
        res.json([
          {
            "action": "talk",
            "text": "welcome to ivr system, press 1 for telugu, press 2 for english, press 3 for kannada, press 4 for hindi, press 8 to repeat, press 9 to exit",
            "bargeIn": true
          },
          inputAction
        ]);
        break;
      case "9":
        res.json([]);
        break;
      default:
        res.json([
          {
            "action":"talk",
            "text":"you have choosen wrong option, please choose a valid option"
          },
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
