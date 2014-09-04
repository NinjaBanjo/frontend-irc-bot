// The namespace for our bot
var bot = {
    options: {
        network: 'chat.freenode.net',
        primaryChannel: '##frontend'
    }
};
if (process.env.NODE_ENV === 'dev') {
    bot.options.network = 'chat.freenode.net';
    bot.options.primaryChannel = '#Test';
}
var irc = require('irc');
var client = new irc.Client(bot.options.network, 'frontend-bot', {
    autoRejoin: true,
    floodProtection: true,
    autoConnect: false
});

// Wrapping everything in an anonymous function for usability
(function () {
    bot.init = function () {
        // Identify with Freenode if not in dev env
        {

        }
        client.say('nickserv', 'identify ' + process.env.IRC_PASS);
        // Join our channel(s) and bind our listeners after we successfully join them
        client.join(bot.options.primaryChannel, function () {
            console.log('joined channel' + "\n");
        });
        bot.bindListeners();
        bot.bindDebugListeners();
    };
    bot.bindListeners = function () {
        // Respond to callouts in the channel
        client.addListener('message' + bot.options.primaryChannel, function (from, message) {
            // I have a question
            if (message.match(/^i have a question/)) {
                bot.msgPrimaryChannel('add transform: translateZ(0);', from);
            }
            // Google
            if (message.match(/^(`g |google |!g )/)) {
                var queryString = message.replace(/^(`g |google |!g )/, '');
                bot.msgPrimaryChannel('http://lmgtfy.com/?q=' + encodeURIComponent(queryString), from);
            }
            // Can I Use
            if (message.match(/^`caniuse /)) {
                var queryString = message.replace(/^`caniuse /, '');
                bot.msgPrimaryChannel('http://caniuse.com/#search=' + encodeURIComponent(queryString), from);
            }
        });
    }
    bot.bindDebugListeners = function () {
        // Listen for errors
        client.addListener('error', function (message) {
            console.log('error: ', message);
        });
    }
    bot.msgPrimaryChannel = function (message, from) {
        from = from || '';
        if (from !== '') {
            client.say(bot.options.primaryChannel, from + ', ' + message);
        } else {
            client.say(bot.options.primaryChannel, message);
        }
    }
}());

client.connect(5, function () {
    bot.init();
});