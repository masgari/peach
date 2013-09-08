module.exports = function (app, config, imageMiddleware) {
    return {
        image: [function (req, res, next) {
            console.log('getting the image');
            req.params.id

            res.sendfile(app.set('public') + '/images.html');
            //next();
        }
        ],

        upload: [function (req, res, next) {
            console.log('uploading image');
            //res.setHeader('Content-Type', 'text/html');
            if (!req.files.file || req.files.file.size == 0)
                res.send({ msg: 'No file uploaded at ' + new Date().toString() });
            else {
                imageMiddleware.storeImage(req.files.file)(req, res);
            }
            //next();
        }]
    };
};