var SSHConnection = require('ssh2');
var async = require('async');
var util = require('util');
var events = require('events');

var DEFAULT_MAX_THREADS = 50;
var CONNECT_OPTION_KEYS = [
    'host', 'port', 'hostHash', 'hostVerifier', 'username', 'password',
    'agent', 'privateKey', 'passphrase', 'tryKeyboard', 'pingInterval',
    'readyTimeout', 'sock', 'agentForward'
];

function Parallel(hostList, command, options) {
    events.EventEmitter.call(this);
    this.hostList = hostList;
    this.command = command;
    this.options = options;
    this.connections = [];
    this.stopped = false;
    this._limit = options.maxThreads || DEFAULT_MAX_THREADS;
}
util.inherits(Parallel, events.EventEmitte  r);

Parallel.prototype.exec = function(callback) {
    var self = this;
    async.mapLimit(
        this.hostList,
        this._limit,
        function(host, asyncCallback) {
            var result = { host: host };
            if (self.stopped) {
                result.error = 'interrupted';
                return asyncCallback(null, result);
            }
            var conn = new SSHConnection(self.options);
            var connectOptions = {};
            CONNECT_OPTION_KEYS.forEach(function(key) {
                if (self.options[key]) {
                    connectOptions[key] = self.options[key];
                }
            });
            self.emit('start', host);
            self.connections.push(conn);
            conn
                .on("ready", function() {
                    conn.exec(self.command, function(err, stream) {
                        if (err) {
                            result.error = err;
                            conn.end();
                            return;
                        }
                        stream
                            .on("exit", function(code) {
                                result.code = code;
                                conn.end();
                            })
                            .on("data", function(data) {
                                self.emit('data', host, data);
                            })
                            .stderr.on("data", function(data) {
                                self.emit('stderr', host, data);
                            });
                    })
                })
                .once("error", function(err) {
                    self.emit('stop', host);
                    result.error = err;
                    asyncCallback(null, result);
                })
                .once("end", function() {
                    self.emit('stop', host);
                    asyncCallback(null, result);
                })
                .connect(connectOptions);

        },
        function(err, results) {
            callback(results);
        }
    );
};

Parallel.prototype.interrupt = function() {
    this.stopped = true;
    for (var i=0; i < this.connections.length; ++i) {
        var connection = this.connections[i];
        if (connection._sock && connection._sock.readyState !== 'closed') {
            connection._sock.end();
            connection._sock.destroy();
            connection.emit("error", "interrupted");
        }
    }
    this.emit('interrupt');
};

module.exports = Parallel;