var mongoose = require('mongoose');

module.exports = function (app) {

    var ImageSchema = new mongoose.Schema({
        file_id: { type: mongoose.Schema.Types.ObjectId},
        uploadDate: {type:Date, required:true}
    });

    ImageSchema.method('connect', function(){});
    return mongoose.model('Image', ImageSchema);
}
