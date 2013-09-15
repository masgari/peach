/**
 * Represent an uploaded image. Some extra data such as upload date, user tags, thumbnail size, etc.
 * kept separately from the image
 * @type {*}
 */

var mongoose = require('mongoose'),
    Grid = require('gridfs-stream'),
    fs = require('fs');

Grid.mongo = mongoose.mongo;

module.exports = function (app, config) {

    var ImageSchema = new mongoose.Schema({
        file_id: { type: mongoose.Schema.Types.ObjectId},
        uploadDate: {type: Date, required: true}
    });

    var conn = mongoose.createConnection(config.mongodb.uri);
    conn.once('open', function () {
        ImageSchema.gfs = Grid(conn.db);
        console.log('GridFS configured.');
    });


    ImageSchema.statics.storeImage = function (file, userId) {
        //console.log('piping file:' + file.path + ' to mongo gridfs for user:' + userId);
        var writeStream = ImageSchema.gfs.createWriteStream({filename: file.name, metadata: {userId: userId}});
        fs.createReadStream(file.path).pipe(writeStream);
        writeStream.on('close', function (gridFile) {
            console.log('new uploaded image id:', gridFile._id);
            //delete the file
            fs.unlink(file.path, function (err) {
                if (err) throw err;
            });
        });

    };

    ImageSchema.statics.findUserImages = function(userId, piCallback) {
        var query = {'metadata.userId':userId};
        ImageSchema.gfs.files.find(query).toArray(piCallback);
    }


    /**
     * Lookup image in mongo gridfs
     * @param query query object, in format: {imageId: <image id>, userId:<user id>}
     * @returns {*}
     */
    ImageSchema.statics.findImage = function (query) {
        return ImageSchema.gfs.createReadStream({_id: query.imageId});
    };
    return mongoose.model('Image', ImageSchema);
}
