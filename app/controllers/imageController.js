var mongoose = require('mongoose');

module.exports = function (app, Image) {
    var controller = {};

    controller.image = function (req, res, next) {
        Image.findImage(req.params.id, req.user.id, function(err, stream){
            if (err) next(err);
            else {
                if(!stream) return res.send(401); //trying to access others images by id??
                else {
                    res.setHeader('Content-Type', 'image/png');
                    stream.pipe(res);
                }
            }
        });
    };

    controller.upload = function (req, res, next) {
        console.log('uploading image');
        //res.setHeader('Content-Type', 'text/html');
        if (!req.files.file || req.files.file.size == 0)
            res.send({ msg: 'No file uploaded at ' + new Date().toString() });
        else {
            Image.storeImage(req.files.file, req.user.id);
            res.redirect('/album');
        }
        //next();
    };

    controller.listUserImages = function(req, res, next) {
        console.log("listing images for user:", req.user.id);
        return Image.findUserImages(req.user.id, function (err, images) {
            if (err) return next(err);
            return res.json(images);
        });
    };

    controller.preDeleteImage = function (req, res, next) {
        //try to find an image that matches the ID in the uri and belongs to the user who is logged in
        Image.find({_id: req.params.id, userId: req.user.id}, function (err, results) {
            if (err) return next(err);
            if(!results) return res.send(401); //trying to delete another user image?
            req.Model = Image;
            next();
        });
    }

    controller.deleteImage = function(req, res, next) {
        var imageId = req.params.id;
        console.log("deleting:", imageId);
        return Image.deleteImage(imageId, function (err, images) {
            if (err) return next(err);
            return res.json(images);
        });
    };
    return controller;
}