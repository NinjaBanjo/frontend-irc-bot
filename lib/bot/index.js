"use strict";
var irc = require('irc'),
    pluginLoader = require('../plugin-loader'),
    network = require('./network.js'),
    Auth = require('../auth');

var Bot = function (config) {
    var i,
        len;
    // Make sure config is the right format
    for (i = 0, len = config.length; i < len; i++) {
        if (!config[i] || typeof config[i] !== "object") {
            throw new Error("Bot constructor: config[" + i + "] is not an object.");
        }
    }

    this.__config = config;
    this._networks = {};

    // Command trigger for bot
    this.__trigger = '`';
    this.__commands = {};

    process.on('uncaughtException', function (err) {
        process.stderr.write("\n" + err.stack + "\n\n");
    });
};

Bot.prototype.init = function () {
    var self = this;
    for (var networkName in this.__config.networks) {
        if (networkName.length > 50) {
            throw new Error('network name has to be 50 chars or less');
            process.exit(1);
        }
        var networkConfig = this.__config.networks[networkName],
            client = new irc.Client(networkConfig.host, networkConfig.nick, {
                user: networkConfig.user || networkConfig.nick,
                port: networkConfig.port || '6667',
                secure: networkConfig.secure || false,
                autoRejoin: true,
                floodProtection: true,
                autoConnect: false
            });
        // Create server object to store client as.
        var newNetwork = new network(networkName, client, networkConfig);

        // We use a closure so we can pass the variable to the callback
        (function (server) {
            // Bind the registered listener so we can identify and do initial join of configured channels
            server.getClient().addListener('registered', function () {
                // Pass the server id to the callback
                Bot.prototype.identify.call(self, server);
                Bot.prototype.joinChannels.call(self, newNetwork);
            });
            // Bind the message listener for all channels
            server.getClient().addListener('message', self.bindListener.call(self, 'message', server));
        })(newNetwork);
        // bind pm listener
        newNetwork.getClient().addListener('pm', function (from, message) {
            Bot.prototype.log(from + ' => ME: ' + message);
        });
        // Bind error listener
        newNetwork.getClient().addListener('error', function (err) {
            Bot.prototype.log(err);
        });
        // Connect to the IRC network
        Bot.prototype.log.call(this, "Connecting...");
        // Initialize auth lib for server
        newNetwork.auth = new Auth(newNetwork);
        // Store server in the list
        this._networks[networkName] = newNetwork;
        // Initialize Network Connection after 5 seconds
        newNetwork.getClient().connect(5);
    }
};

Bot.prototype.joinChannels = function (network) {
    var self = this;
    Bot.prototype.log.call(this, 'Joining Channels...');
    for (var i = 0, len = this.__config.networks[network.getName()].channels.length; i < len; i++) {
        // Closure is used so channel is available in the callback
        (function (channel) {
            network._client.join(self.__config.networks[network.getName()].channels[i], function () {
                Bot.prototype.log('Channel ' + channel + ' Joined');
            });
        })(this.__config.networks[network.getName()].channels[i]);
    }
};

Bot.prototype.identify = function (network) {
    Bot.prototype.log('Authenticating...');
    network.getClient().say('nickserv', 'identify ' + this.__config.networks[network.getName()].password);
    Bot.prototype.log('Authenticated');
};


Bot.prototype.log = function (message) {
    console.log(message);
};

Bot.prototype.getCommand = function (server, command) {
    return this.__commands[command];
};

Bot.prototype.listeners = {
    message: function (network, args) {
        var reg = new RegExp("^" + this.__trigger),
            text = args[2],
            additionalArguments = [args[0], args[1], args[2], args[3]],
            target;
        if (reg.test(text) && text != this.__trigger) {
            var command = text.match(new RegExp("^" + this.__trigger + "[a-zA-Z0-9-_\/]+ ?"))[0].trim().replace(reg, '').toLowerCase(),
                parameters = text.split(new RegExp("^" + this.__trigger + "[a-zA-Z0-9-_\/]+ "), 2)[1] || '',
                matchedCommand = network.getCommandByName(command);
            (function (parameters) {
                network.auth.authorize(network, command, additionalArguments[0])
                    .then(function (res) {
                        if (typeof res === "object" && res.auth === true) {
                            // Commands will always come back as objects
                            if (typeof matchedCommand === "object") {
                                // Handle lookup for alternative target for response
                                if (typeof parameters === "string") {
                                    target = Bot.prototype.findTarget(parameters.trim());
                                    if (typeof target === "string" && target !== undefined && target !== '') {
                                        // reuse the reg var for targeting
                                        reg = new RegExp('@ ?' + target + ' ?' + '$');
                                        parameters = parameters.replace(reg, '');
                                        additionalArguments[0] = target;
                                    }
                                }
                                matchedCommand.getCallback().apply(this, [network.getClient()].concat(command, parameters, additionalArguments));
                            }
                        } else {
                            network.getClient().notice(additionalArguments[0], res.message);
                        }
                    }, function (res) {
                        network.getClient().notice(additionalArguments[0], 'Sorry, something went wrong.');
                    });
            })(parameters);
        }
    }
};

Bot.prototype.findTarget = function (text) {
    var matched = text.match(new RegExp(/@ ?[a-z]{1}[a-z0-9-_`\|]* ?$/gi));
    if (matched !== null) {
        matched = matched[0].replace('@', '').replace(' ', '');
    }
    return matched;
};

Bot.prototype.bindListener = function (name, network) {
    var self = this;
    return function () {
        Bot.prototype.listeners[name].apply(self, [network].concat(arguments));
    };
};

Bot.prototype.getNetworkByClient = function (options) {
    // toto: build this guy out. Not sure how to match client yet (what's realistic/needed)
};

module.exports = Bot;