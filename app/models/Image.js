/**
 * Represent an uploaded image. Some extra data such as upload date, user tags, thumbnail size, etc.
 * kept separately from the image
 * @type {*}
 */

var mongoose = require('mongoose'),
    Grid = require('gridfs-stream'),
    ExifImage = require('exif').ExifImage,
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


    ImageSchema.statics.storeImage = function (file, userId) {
        //console.log('piping file:' + file.path + ' to mongo gridfs for user:' + userId);
        var exifTags;
        if (config.peach.extractExifTags) {
            new ExifImage({image: file.path}, function (err, exifMetadata) {
                console.log('exif metadata extracted.');
                if (err) {
                    console.log('error in extracting exif tags', err);
                    exifTags = {error: err};
                } else {
                    console.log(exifMetadata);
                    exifTags = exifMetadata;
                }
                //call write stream
                writeImage(ImageSchema.gfs, file, userId, exifTags);
            });

        } else {
            console.log('no exif metadata');
            writeImage(ImageSchema.gfs, file, userId, {});
        }
    };

    ImageSchema.statics.findUserImages = function (userId, piCallback) {
        var query = {'metadata.userId': userId};
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

    function writeImage(gfs, file, userId, exifTags) {
        var writeStream = gfs.createWriteStream({filename: file.name, metadata: {userId: userId, exif: exifTags}});
        fs.createReadStream(file.path).pipe(writeStream);
        writeStream.on('close', function (gridFile) {
            console.log('new uploaded image id:', gridFile._id);
            //delete the file
            fs.unlink(file.path, function (err) {
                if (err) console.log('error in removing file:', file.path);
            });
        });
    }

    return mongoose.model('Image', ImageSchema);
};
