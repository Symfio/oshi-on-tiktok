const express = require('express');
const SSEChannel = require('sse-pubsub');
const app = express();
const channel = new SSEChannel();
const scrap = require('./scrap');
const Promise = require('bluebird');

const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); //replace localhost with actual host
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');
    next();
}

app.use(corsMiddleware);
app.get('/', (req, res) => res.send("OK"));
app.get('/stream', (req, res) => channel.subscribe(req, res));

app.listen(3000, '0.0.0.0', () => {
    console.log("Running scrap and server");
    Promise.delay(5000).then(() => cron(channel));
});