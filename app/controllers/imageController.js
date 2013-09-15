var mongoose = require('mongoose');

module.exports = function (app, Image) {
    var controller = {};

    controller.image = function (req, res, next) {
        var stream = Image.findImage({imageId: req.params.id, userId: req.user.id});
        res.setHeader('Content-Type', 'image/png');
        stream.pipe(res);
    };

    controller.upload = function (req, res, next) {
        console.log('uploading image');
        //res.setHeader('Content-Type', 'text/html');
        if (!req.files.file || req.files.file.size == 0)
            res.send({ msg: 'No file uploaded at ' + new Date().toString() });
        else {
            Image.storeImage(req.files.file, req.user.id);
            res.redirect('/images');
        }
        //next();
    };

    controller.listUserImages = function(req, res, next) {
        console.log("listing images for user:", req.user.id);
        return Image.findUserImages(req.user.id, function (err, images) {
            if (err) return next(err);
            console.log('results=', images);
            return res.json(images);
        });
    }
    return controller;
}