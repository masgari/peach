var mongoose = require('mongoose');

module.exports = function (config) {
    //set up mongoose database connection
    if(!mongoose.connection.readyState){
      mongoose.connect(config.mongodb.uri);
    }
}