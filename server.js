// Filename:    server.js
// Description: Server file with routes for messenger bot
// Author:      EVGENI C. DOBRANOV
// Date:        12/23/2016

var app        = require('express')();
var bodyParser = require('body-parser');
var request    = require('request');
var Parser     = require('expr-eval').Parser;

// Initialize the body parser (lets us get data from POST)
app.use(bodyParser.json());

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
                        // Process current event only if it's a message and
                        // isn't an echo (a message sent from the bot itself)
                        var event = events[i];
                        if (event.message && !event.message.is_echo) {
                                receivedMessage(event);
                        }
                }
                
                res.sendStatus(200);
        }
});

/***********************
 * Process user input  *
 ***********************/
function receivedMessage(event) {

        // Local variables separating all message event entities
        var senderID           = event.sender.id;
        // var recipientID        = event.recipient.id;
        // var timeOfMessage      = event.timestamp;
        var message            = event.message;
        // var messageId          = message.mid;
        var messageText        = message.text;
        var messageAttachments = message.attachments;

        /*
        console.log("Received message for user %d and page %d at %d with message:", 
                senderID, recipientID, timeOfMessage);
        console.log(JSON.stringify(message));
        */

        // Process cases from user input
        if (messageText)
        {
                if (messageText.match(/(help)/i)) {
                        messageText = "help";
                }

                switch (messageText) {

                        case 'help' :
                                messageText = "The following basic operators are supported:\n" + 
                                               "- addition (a + b)\n"                          +
                                               "- subtraction (a - b)\n"                       +
                                               "- multiplication (a * b)\n"                    +
                                               "- division (a / b)\n"                          +
                                               "- exponentiation (a ^ b)\n"                    +
                                               "- ln a / log10 a\n"                            +
                                               "- sin a / cos a / tan a\n"                     +
                                               "- asin a / acos a / atan a\n"                  +
                                               "- factorial (a!)\n"                            +
                                               "- grouping (a * (b + c))\n"                    +
                                               "Full documentation can be found at:\n"         +
                                               "https://github.com/silentmatt/expr-eval/tree/master";

                                sendTextMessage(senderID, messageText);
                        break;

                        // Try evaluating the expression and handle any possible errors
                        default:
                                try {
                                        messageText = Parser.evaluate(messageText).toString();
                                }
                                catch (err) {
                                        messageText = "Hmm, your expression doesn't look quite " +
                                                      "right... Try typing 'help' for some guidance.";
                                }
                                finally {
                                        sendTextMessage(senderID, messageText);
                                }
                }

        // Add some output for message attachments
        } else if (messageAttachments) {
                sendTextMessage(senderID, "That's a nice attachment! But try entering text instead please :)");
        }
}

/**********************************************************
 * Construct message response and call request() function *
 **********************************************************/
function sendTextMessage(recipientId, messageText) {
        
        var messageData = {
                recipient : { id   : recipientId },
                message   : { text : messageText }
        };

        callSendAPI(messageData);
}

/************************************
 * Sends processed data to the user *
 ************************************/
function callSendAPI(messageData) {

        request (
        {
                uri    : 'https://graph.facebook.com/v2.6/me/messages',
                qs     : { access_token: process.env.PAGE_ACCESS_TOKEN },
                method : 'POST',
                json   : messageData
        },

        // Debugging output for response (or attempt) made
        function (error, response, body) {
                if (!error && response.statusCode == 200) {
                        var recipientId = body.recipient_id;
                        var messageId = body.message_id;
                        console.log("Successfully sent message with id %s to recipient %s", 
                                messageId, recipientId);
                } else {
                        console.error("Unable to send message.");
                        console.error(response);
                        console.error(error);
                }
        });  
}

/**********************************************************
* Find the port number, and start the server on that port *
***********************************************************/
var port = process.env.PORT || 5000
app.listen(port);
console.log("Magic happens on port " + port);