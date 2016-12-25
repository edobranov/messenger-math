# messenger-math

## Author

Evgeni Dobranov

## Description
A simple bot that leverages the Facebook Messenger API to take user input, parse out a mathematical expression and return what it evaluates to.

## Structural Overview

### GET / POST Routes Defined
Naturally, all of the code needed to run the actual Messenger service lies within Facebook's servers. The component this project takes care of (found almost entirely in `server.js`) is providing a pingable server with a special `/webhook` POST route that can interpret the input sent from the Messenger API and designate some behavior. In this case, I simply run the input through a `switch` statement and an external Node.js parser module.

The `/webhook` GET route is for verification on Facebook's behalf of my server, and doesn't serve any real purpose outside of that to the user.

### Processing User Input
While not too difficult to figure out as a whole, the `/webhook` POST route generally does the following in a few steps:

1. Check that the input / request is a valid `pages` object, and iterate through all of the events in it (of which there'll almost always be just one).
2. Extract the sender's Facebook ID, message text, etc. from the current event.
3. Perform a regex check on the input to see if the user requested help. The regex just sees if the case-insensitive "help" is found anywhere in the input (i.e. - "help", "Help", "Help!", "Pls HeLP mE!!11!1", etc.)
4. If it does evaluate to "help" set the message text to the help text. Otherwise, run the input through the Parser object from the `expr-eval` module. This is in a catch-try-finally statement since the Parser object doesn't handle errors and crashes the server otherwise (\*_grumble_\* speaking from experience...).
5. Regardless of what happens in (4), construct the message response and send it to the Messenger API via the `request` object.

Special thank you to the contributors of the `expr-eval` NPM module:

NPM Doc: https://www.npmjs.com/package/expr-eval

Github: https://github.com/silentmatt/expr-eval

## Example & Requesting Access
Initially, the Messenger Bot greets the user like so:

![alt_text](https://raw.githubusercontent.com/edobranov/messenger-math/master/greeting.JPG "Greeting")

And here are some example inputs:

![alt_text](https://raw.githubusercontent.com/edobranov/messenger-math/master/expressions.JPG "Expressions")

While this is more of a personal exercise, if you'd like to play around with the bot, just PM me on Facebook or by email for access (found at the bottom of my website: http://edobranov.github.io/#contact). Currently the bot is private so only admins / developers / testers can access it. You could, of course, just copy the code and run it for yourself (and are encouraged to do so!) if you have the desire. There are some really great tutorials on setting up Messenger bots, so I won't regurgitate that info here.

## Moving Forward
One thing to definitely consider is **data persistence**. It would be pretty cool to let the user define their own variables throughout the chat, and especially reference the most recent result from the bot with `ans` or something along those lines (kind of like how TI calculators do). Improving the recognition of input might require messing around with the `expr-eval` module, but it would also make the bot quite a bit more versatile.
