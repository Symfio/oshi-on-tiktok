const mongoose = require('mongoose');
const fs = require('fs')
var mongo_config = {
    useNewUrlParser:false,
    useUnifiedTopology: false
}
mongoose.connect(process.env.MONGO_URI, mongo_config, function (err) {    
    if (err) throw err;
    console.info('[*] Successfully connected');
});
var Feed = require('./Feed')(mongoose)

module.exports = {
    Feed,
    Schema: mongoose.Schema
}
