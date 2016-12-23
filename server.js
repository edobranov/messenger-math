// Filename:    server.js
// Description: Server file for messenger bot
// Author:      EVGENI C. DOBRANOV
// Date:        12/23/2016

//var express    = require('express');
//var app        = express();
var app        = require('express')();
var bodyParser = require('body-parser');
var request    = require('request');

// Initialize the body parser (lets us get data from POST) and CORS for cross domain accessing of data
app.use(bodyParser.json());

/*
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});
*/

// Initialize the MongoDB client and establish a connection to the database
var mongoUri    = process.env.MONGOLAB_URI || process.env.MONGOHW_URL || 'mongodb://localhost/messenger-math';
var MongoClient = require('mongodb').MongoClient, format = ('util').format;
var db          = MongoClient.connect(mongoUri, function(error, databaseConnection) {
                        if (!error) {
                                console.log("DB connection successful");
                                db = databaseConnection;
                        }
                  });

app.get('/', function (req, res) {
    res.send('Hello world!');
});

app.get('/webhook', function(req, res) {
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN)
        {
                console.log("Validating webhook");
                res.status(200).send(req.query['hub.challenge']);
        } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);          
        }
});

//-------------------------------------------------------------------------------

/*

app.post('/webhook', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text;
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
        }
    }
    res.sendStatus(200);
});

function sendTextMessage(sender, text)
{
    let messageData = { text : text }
    
    request(
        {
                url    : 'https://graph.facebook.com/v2.6/me/messages',
                qs     : { access_token : process.env.PAGE_ACCESS_TOKEN },
                method : 'POST',
                json   : { recipient : { id : sender },
                           message   : messageData }
        },

    function(error, response, body)
    {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
*/

app.post('/webhook', function (req, res) {
  var data = req.body;

  console.log("Request body: ", data);

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        // sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}








// Find the port number, and start the server on that port
var port = process.env.PORT || 5000
app.listen(port);
console.log("Magic happens on port " + port);