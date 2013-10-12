var face = require('../index'),
    should = require('should'),
    fs = require('fs'),
    assert = require("assert");

module.exports = {
    setUp: function (callback) {
        var testSelf = this;
        should.exist(face.createClient);
        this.client = face.createClient();
        should.exist(this.client);

        this.client.on('face-ready', function () {
            testSelf.faceConnected = true;
            //console.log('face client connected.', testSelf.faceConnected);
        });
        this.client.on('face-error', function (e) {
            console.log('Error in face client:', e);
            callback(e);
        });

        this.client.on('job-done-error', function (e) {
            console.log('Error in job-done client:', e);
            callback(e);
        });

        should.exist(this.client.connect);

        this.client.connect(function (err) {
            throw err;
        });
        callback();
    },

    tearDown: function (callback) {
        should.exist(this.client.end);
        //console.log('faceConnected, shutting down redis clients', this.faceConnected);
        this.client.end(function (err) {
            console.log('Error in tearDown:', err);
            callback(err);
        });
        callback();
    },

    testSubmitFaceDetectJob: function (test) {
        should.exist(this.client.submitFaceDetectJob);
        this.client.submitFaceDetectJob('imageId', 'userId', function (err) {
                test.equals(err, null, 'No error should be thrown.' + err);
                //console.log('job submitted.');
                test.done();
            }
        );
    },
    testNotifyJobDone: function (test) {
        should.exist(this.client.submitFaceDetectJob);
        this.client.on('job-done-message', function(message){
            console.log('message received from redis job-done, message=', message);
            test.ok(message != null);
            var msg = JSON.parse(message);
            test.equals(msg.imageId, 'imageId');
            test.equals(msg.userId, 'userId');
            test.done();
        });
        this.client.submitFaceDetectJob('imageId', 'userId', function (err) {
                test.equals(err, null, 'No error should be thrown.' + err);
                //console.log('job submitted.');
                //test.done();
            }
        );
    }
}