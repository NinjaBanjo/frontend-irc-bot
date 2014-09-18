var irc = require('irc');

var Bot = module.exports = function (config) {
    // Make sure config is the right format
    for (var i = 0, len = config.length; i < len; i++) {
        if (!config[i] || typeof config[i] !== "object") {
            throw new Error("Bot constructor: config[" + i + "] is not an object.");
        }
    }

    this.__config = config;
    this.__clients = [];

    this.__listening = [];

    // Command trigger for bot
    this.__trigger = '`';
    this.__commands = {};

    process.on('uncaughtException', function (err) {
        process.stderr.write("\n" + err.stack + "\n\n");
    });
};

Bot.prototype.init = function () {
    var self = this;
    for (var i = 0, len = this.__config.servers.length; i < len; i++) {
        var serverConfig = this.__config.servers[i];
        var client = new irc.Client(serverConfig.host, serverConfig.nick, {
            user: serverConfig.user || 'serverConfig.nick',
            port: serverConfig.port || '6667',
            secure: serverConfig.secure || false,
            autoRejoin: true,
            floodProtection: true,
            autoConnect: false
        });
        // We use a closure so we can pass the variable to the callback
        (function (i) {
            client.addListener('registered', function () {
                // Pass the server id to the callback
                Bot.prototype.identify.call(self, i);
                Bot.prototype.joinChannels.call(self, i);
            });
            client.addListener('message', this.bindListener.call(self, 'message', i));
        })(i);
        client.addListener('error', function (err) {
            Bot.prototype.log(err);
        });
        client.addListener('pm', function (from, message) {
            Bot.prototype.log(from + ' => ME: ' + message);
        });
        Bot.prototype.log.call(this, "Connecting...");
        client.connect(5);
        this.__clients[i] = client;
    }
};

Bot.prototype.joinChannels = function (clientId) {
    var self = this;
    Bot.prototype.log.call(this, 'Joining Channels...');
    for (var i = 0, len = this.__config.servers[clientId].channels.length; i < len; i++) {
        // Closure is used so channel is available in the callback
        (function (channel) {
            self.__clients[clientId].join(self.__config.servers[clientId].channels[i], function () {
                Bot.prototype.log('Channel ' + channel + ' Joined');
            });
        })(this.__config.servers[clientId].channels[i]);
    }
};

Bot.prototype.identify = function (clientId) {
    Bot.prototype.log('Authenticating...');
    this.__clients[clientId].say('nickserv', 'identify ' + this.__config.servers[clientId].password);
    Bot.prototype.log('Authenticated');
};


Bot.prototype.log = function (message) {
    console.log(message);
};

Bot.prototype.registerCommand = function (command, pluginName, pluginFunction) {
    var callback = this.__plugins[pluginName][pluginFunction];
    this.__commands[command] = {
        command: command,
        callback: callback
    }
};

Bot.prototype.unregisterCommand = function (command) {
    delete this.__commands[command];
};

Bot.prototype.getCommand = function (command) {
    return this.__commands[command];
};

Bot.prototype.listeners = {
    // todo: Need to impliment a listener for this one still
    disconnect: function (clientId, reason) {
        Bot.prototype.log.call(this, "Disconnected (" + reason + "), reconnecting in 15s");

        var bot = this;
        setTimeout(function () {
            Bot.prototype.log.call(this, "Connecting...");
            this.__clients[clientId].connect();
        });
    },
    message: function (clientId, args) {
        var client = [Bot.prototype.getClient.call(this, clientId)];
        var reg = new RegExp("^" + this.__trigger);
        var text = args[2];
        var additionalArguments = [args[0], args[1], args[2], args[3]];
        if (reg.test(text) && text != this.__trigger) {
            var command = text.match(new RegExp("^" + this.__trigger + "[a-zA-Z0-9-_\/]+ ?"))[0].trim().replace(reg, '');
            var parameters = text.split(new RegExp("^" + this.__trigger + "[a-zA-Z0-9-_\/]+ "), 2)[1];
            var matchedCommand = Bot.prototype.getCommand.call(this, command);
            // Commands will always come back as objects
            if (typeof matchedCommand === "object") {
                // Handle lookup for alternative target for response
                if (typeof parameters === "string") {
                    var target = Bot.prototype.findTarget(parameters.trim());
                    if (typeof target === "string" && target !== undefined && target !== '') {
                        var reg = new RegExp('@ ?' + target + ' ?' + '$');
                        parameters = parameters.replace(reg, '');
                        additionalArguments[0] = target;
                    }
                }
                matchedCommand.callback.apply(this, client.concat(command, parameters, additionalArguments));
            }
        }
    }
};

Bot.prototype.findTarget = function (text) {
    var matched = text.match(new RegExp("@ ?[a-z]{1}[a-z0-9-_`]* ?$", "gi"));
    if (matched !== null) {
        matched = matched[0].replace('@', '').replace(' ', '');
    }
    return matched;
};

Bot.prototype.bindListener = function (name, clientId) {
    var self = this;
    return function () {
        Bot.prototype.listeners[name].apply(self, [clientId].concat(arguments));
    };
};

Bot.prototype.getClient = function (clientId) {
    return this.__clients[clientId];
};