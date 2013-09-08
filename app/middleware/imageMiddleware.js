var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var fs = require('fs');


module.exports = function (app, config, Image) {
    var imageStore = {};
    var conn = mongoose.createConnection(config.mongodb.uri);
    conn.once('open', function () {
        imageStore.gfs = Grid(conn.db);
        console.log('GridFS setup:' + imageStore.gfs);
    });
    imageStore.connect = function () {

    };

    imageStore.storeImage = function (file) {
        return function (req, res, next) {
            var writeStream = imageStore.gfs.createWriteStream({filename: file.name, metadata:{userId: req.user.id}});
            //console.log('piping file:' + file.path + ' to stream:' + writeStream);
            fs.createReadStream(file.path).pipe(writeStream);
            writeStream.on('close', function (gridFile) {
                //console.log('closing the write stream');
                //delete the file
                fs.unlink(file.path, function (err) {
                    if (err)
                        throw err;
                    else {
                        //console.log('successfully deleted ' + file.path);
                        res.redirect('/images');
                    }
                });
            });
            //return next();
        }
    };

    return imageStore;
}