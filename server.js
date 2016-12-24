// Filename:    server.js
// Description: Server file for messenger bot
// Author:      EVGENI C. DOBRANOV
// Date:        12/23/2016

var app        = require('express')();
var bodyParser = require('body-parser');
var request    = require('request');
var Parser     = require('expr-eval').Parser;

// Initialize the body parser (lets us get data from POST)
app.use(bodyParser.json());

/*
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});
*/

/****************************************************************************
 * Initialize the MongoDB client and establish a connection to the database *
 ****************************************************************************/
var mongoUri    = process.env.MONGODB_URI || process.env.MONGOHW_URL || 'mongodb://localhost/messenger-math';
var MongoClient = require('mongodb').MongoClient, format = ('util').format;
var db          = MongoClient.connect(mongoUri, function (error, databaseConnection) {
                        if (!error) {
                                db = databaseConnection;
                        }
                        else {
                                console.log("MONGODB connection unsuccessful: ", error);
                        }
                  });

/**************************************
 * Default route for app landing page *
 **************************************/
app.get('/', function (req, res) {
    res.send('Hello world!');
});

/****************************************************************************************************
 *                    Validation route for Facebook's API (not for user access)                     *
 *                                                                                                  *
 *   Code provided at: https://developers.facebook.com/docs/messenger-platform/guides/quick-start   *
 *                                                                                                  *
 * Can alternatively go to terminal and run the following (replacing PAGE_ACCESS_TOKEN):            *
 * curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=PAGE_ACCESS_TOKEN" *
 ****************************************************************************************************/
app.get('/webhook', function (req, res) {
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
                res.status(200).send(req.query['hub.challenge']);
        } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
        }
});

/***************************************************************************
 * Route to which the Messenger API sends POST data with user interactions *
 ***************************************************************************/
app.post('/webhook', function (req, res) {

        // Local variable to hold all user data
        var data = req.body;

        // Proceed only if this is a page subscription
        if (data.object === 'page') {

                // Get all messaging events and iterate over them
                var events = data.entry[0].messaging
                for (var i = 0; i < events.length; i++)
                {
                        // Process current event only if it's a message and isn't an
                        // echo (indicates a message sent from the bot itself)
                        var event = events[i];
                        if (event.message && !event.message.is_echo) {
                                receivedMessage(event);
                        }
                }
                
                res.sendStatus(200);
        }
});

/****************************
 * Process user input cases *
 ****************************/
function receivedMessage(event) {

        // Local variables separating all message event entities
        var senderID           = event.sender.id;
        var recipientID        = event.recipient.id;
        var timeOfMessage      = event.timestamp;
        var message            = event.message;
        var messageId          = message.mid;
        var messageText        = message.text;
        var messageAttachments = message.attachments;

        console.log("Received message for user %d and page %d at %d with message:", 
                senderID, recipientID, timeOfMessage);
        console.log(JSON.stringify(message));

        // Process cases
        if (messageText)
        {
                switch (messageText) {
                        case 'reset' :
                                // sendGenericMessage(senderID);
                        break;

                        case 'help' :

                        break;

                        default:
                                try {
                                        messageText = Parser.evaluate(messageText).toString();
                                }
                                catch (err) {
                                        console.log(err);
                                        messageText = "Hmm, your expression doesn't look quite " +
                                                      "right... Try typing 'help' for some guidance.";
                                }
                                finally {
                                        sendTextMessage(senderID, messageText);
                                }
                                /*
                                if (messageText.match(/^[0-9\+\-\*\/\t ]*$/)) {
                                        var ans = Parser.evaluate(messageText);
                                        if (ans) {
                                                sendTextMessage(senderID, ans.toString());
                                        }
                                        else {
                                                sendTextMessage(senderID, "Hmm, your expression doesn't " +
                                                        "look quite right... Try typing 'help' for some guidance.");
                                        }
                                }
                                else {
                                        sendTextMessage(senderID, "Hmm, your expression doesn't " +
                                                "look quite right... Try typing 'help' for some guidance.");
                                }
                                */
                }

        } else if (messageAttachments) {
                sendTextMessage(senderID, "Message with attachment received");
        }
}

// function checkInputValidity(messageText) {
        
//        return messageText.value.match(/^[0-9]+$/);

//}

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
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
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