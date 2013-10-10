
var redis = require("redis"),
    util = require('util'),
    events = require('events');

/**
 * default configurations for Redis
 * @type {{host: string, port: number}}
 */
var DEFAULTS = {
    redisHost: '127.0.0.1',
    redisPort: 6379,
    faceDetectChannelName: 'peach-detect-face-jobs',
    jobDoneChannelName: 'peach-jobs-done'
};

/**
 * Create a new client
 * @param options
 * @constructor
 */
function Client(options) {
    options = options || {};
    this.options = merge(options, DEFAULTS);
}

/**
 *
 * @type {Function}
 */
exports.Client = Client;

util.inherits(Client, events.EventEmitter);

/**
 * Establish a connection to redis server. Re-emits 'connect', 'error' and 'end' events from the underlying connection
 * @param callback - in format function(err) to receive error message
 */
Client.prototype.connect = function (callback) {
    var self = this;
    var jobDoneClient = redis.createClient(self.options.redisPort, self.options.redisHost, self.options),
        faceEngineClient = redis.createClient(self.options.redisPort, self.options.redisHost, self.options);

    configureClient(self, jobDoneClient, 'job-done');
    configureClient(self, faceEngineClient, 'face');

    jobDoneClient.on('ready', function(){
        jobDoneClient.subscribe(self.options.jobDoneChannelName);
    });

    self.jobDoneClient = jobDoneClient;
    self.faceEngineClient = faceEngineClient;
};


function configureClient(faceClient, redisClient, clientPrefix) {
    redisClient.on("error", function (err) {
        faceClient.emit(clientPrefix +'-error', err);
    });

    redisClient.on("ready", function () {
        //console.log("RRR", clientPrefix+"-ready\n");
        faceClient.emit(clientPrefix +'-ready');
    });

    redisClient.on("message", function (


        channel, message) {
        console.log("message", clientPrefix+"-channel:"+channel+", message:"+message);
        faceClient.emit(clientPrefix +'-message', message);
    });
}

/**
 * Close the redis clients
 * @param callback - in format function(err) to receive error message
 */
Client.prototype.end = function (callback) {
    if (this.jobDoneClient) {
        this.jobDoneClient.quit();
        this.faceEngineClient.quit();
    } else {
        callback(new Error('Not connected yet.'));
    }
};

Client.prototype.submitFaceDetectJob = function(imageId, userId, callback) {
    if (this.faceEngineClient) {
        message = {imageId:imageId, userId:userId, submitDate:Date.now()};
        json = JSON.stringify(message);
        this.faceEngineClient.publish(this.options.faceDetectChannelName, json);
        callback(null);
    } else {
        callback(new Error('Not connected yet.'));
    }
};

// main export function
exports.createClient = function (options) {
    return new Client(options);
};


// Helper functions

// callback || noop borrowed from node/lib/fs.js
function noop() {
}


function merge(a, b) {
    if (a && b) {
        for (var key in b) {
            if (typeof a[key] == 'undefined') {
                a[key] = b[key];
            } else if (typeof a[key] == 'object' && typeof b[key] == 'object') {
                a[key] = merge(a[key], b[key]);
            }
        }
    }
    return a;
}