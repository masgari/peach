/**
 * Represent an uploaded image. Some extra data such as upload date, user tags, thumbnail size, etc.
 * kept separately from the image
 * @type {*}
 */

var mongoose = require('mongoose'),
    Grid = require('gridfs-stream'),
    pis = require('pis-client'),
    fs = require('fs');

Grid.mongo = mongoose.mongo;
var BSON = mongoose.mongo.BSONPure

module.exports = function (app, config) {

    var ImageSchema = new mongoose.Schema({
            file_id: { type: mongoose.Schema.Types.ObjectId},
            uploadDate: {type: Date, required: true}
        },
        {
            collection: 'fs.files' //force to use grid fs collection
        }
    );

    var conn = mongoose.createConnection(config.mongodb.uri);
    conn.once('open', function () {
        ImageSchema.gfs = Grid(conn.db);
        console.log('GridFS configured.');
    });

    //create image server client
    ImageSchema.imageClient = pis.createClient();
    ImageSchema.imageServerConnected = false;
    configureThriftClient(ImageSchema.imageClient, ImageSchema.imageServerConnected , 'ImageServer');


    ImageSchema.statics.storeImage = function (file, userId) {
        writeImage(ImageSchema.gfs, file, userId);
    };

    ImageSchema.statics.findUserImages = function (userId, piCallback) {
        var query = {'metadata.userId':userId, 'metadata.type':'resized'};
        ImageSchema.gfs.files.find(query).toArray(piCallback);
    };


    /**
     * Lookup image in mongo gridfs
     * @param imageId id of the image
     * @param userId id of the owner
     * @param piCallback callback function
     */
    ImageSchema.statics.findImage = function (imageId, userId, piCallback) {
        ImageSchema.gfs.files.find({_id: new BSON.ObjectID(imageId), 'metadata.userId': userId}).toArray(function (err, results) {
            if (err)
                piCallback(err, null);
            else if (!results || results.length < 1) {
                return piCallback(null, null);
            } else {
                var stream = ImageSchema.gfs.createReadStream({_id: imageId});
                piCallback(null, stream);
            }
        });
    };

    function writeImage(gfs, file, userId) {
        var writeStream = gfs.createWriteStream({filename: file.name, metadata: {userId: userId}});
        fs.createReadStream(file.path).pipe(writeStream);
        writeStream.on('close', function (gridFile) {
            console.log('new uploaded image id:', gridFile._id);
            //resizing, for test
            resizeImage(gridFile._id, userId, file.name);
            //cartoonizeImage(gridFile._id, userId, file.name);

            //delete the file
            fs.unlink(file.path, function (err) {
                if (err) console.log('error in removing file:', file.path);
            });
        });
    }

    function resizeImage(imageId, userId, fileName) {
        var stream = ImageSchema.gfs.createReadStream({_id: imageId});
        //console.log('reading from gfs stream:', stream);
        var buf = [];
        stream.on('data', function (chunk) {
            buf.push(chunk);
        });
        //when all data read
        stream.on('end', function() {
            var data = Buffer.concat(buf);
            ImageSchema.imageClient.resize(data, 500, 300, function (err, resizeData, w, h) {
                if (err) {
                    console.log('error in resize:%s\n', err);
                } else {
                    console.log('resized image(%d,%d)\n', w, h);
                    var writeStream = ImageSchema.gfs.createWriteStream({filename: 'resized-' + fileName, metadata:
                    {userId: userId, type:'resized', width:w, height: h, sourceId:imageId}});
                    writeStream.write(resizeData);
                    writeStream.end();
                }
            });
        });
    }

    function cartoonizeImage(imageId, userId, fileName) {
        var stream = ImageSchema.gfs.createReadStream({_id: imageId});
        //console.log('reading from gfs stream:', stream);
        var buf = [];
        stream.on('data', function (chunk) {
            buf.push(chunk);
        });
        //when all data read
        stream.on('end', function() {
            var data = Buffer.concat(buf);
            ImageSchema.imageClient.cartoonize(data, 500, 300, function (err, resizeData, w, h) {
                if (err) {
                    console.log('error in cartoonize:%s\n', err);
                } else {
                    console.log('cartoonize image(%d,%d)\n', w, h);
                    var writeStream = ImageSchema.gfs.createWriteStream({filename: 'cartoonized-' + fileName, metadata:
                    {userId: userId, type:'cartoonized', width:w, height: h, sourceId:imageId}});
                    writeStream.write(resizeData);
                    writeStream.end();
                }
            });
        });
    }

    function configureThriftClient(client, connectedVar, label) {
        client.on('connect', function () {
            connectedVar = true;
            console.log('Connected to %s Thrift server.', label);
        });

        client.on('error', function (e) {
            console.log('Error in %s:',label, e);
        });

        client.on('end', function () {
            console.log('%s ended.', label);
        });

        client.connect(function (err) {
            console.log('Error in %s connect:%s\n', label, err);
        });
    }

    return mongoose.model('Image', ImageSchema);
};
