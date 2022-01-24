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

// app.post('/play_audio', (req, res) => {
//   console.log(req.body);
//   res.sendFile("./stream/sample record 1.mp3");
// });

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
        res.json([
          {
            "action":"talk",
            "text":""
          }
        ]);
        break;
      default:
        res.json([
          {
            "action":"talk",
            "text":"you have choosen wrong option, please choose a valid option"
          },
          inputAction
        ]);
        break;
    }
    // res.json([
    //   {
    //     "action":"talk",
    //     "text":"you entered the digit"+entered_digit
    //   },
    //   {
    //     "action": "stream",
    //     "streamUrl": ["https://www.mediafire.com/file/g2tkfdnhsykysc5/voice_api_audio_streaming.mp3"]
    //   }
    // ])
  }
});

// app.post('/answer', (req, res) => {
//   const number = req.body.from.split('').join(' ');
//   const ncco = [
//     {
//       action: 'talk',
//       text: 'Thank you for calling from ' + number,
//       language: 'en-IN',
//       style: '4'
//     },
//     {
//       action: 'stream',
//       streamUrl: [
//         'https://www.albinoblacksheep.com/audio/mp3/RickRollMarioPaint.mp3'
//       ]
//     }
//   ];
//   res.json(ncco);
// });

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));
