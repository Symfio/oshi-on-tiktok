const mongoose = require('mongoose');
const fs = require('fs')
var mongo_config = {
    useNewUrlParser:true,
    useUnifiedTopology: true,
    useMongoClient: true
}
if(process.env.MONGO_USER) {
    mongo_config['auth'] = { authSource: process.env.MONGO_AUTH_SOURCE, authdb: "admin" }
    mongo_config['user'] = process.env.MONGO_USER
    mongo_config['pass'] = process.env.MONGO_PASS
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
