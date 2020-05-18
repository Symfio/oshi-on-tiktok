require('dotenv').config()
const request = require('request');
const fs = require('fs');

var MEDIA_ENDPOINT_URL = 'https://upload.twitter.com/1.1/media/upload.json'
var POST_TWEET_URL = 'https://api.twitter.com/1.1/statuses/update.json'

const OAUTH = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    token: process.env.TWITTER_ACCESS_TOKEN,
    token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}

class VideoTweet {
    constructor(data, cb) {
        var self = this;
        self.file_path = data.file_path;
        self.tweet_text = data.tweet_text;
        self.total_bytes = undefined;
        self.media_id = undefined;
        self.processing_info = undefined;
        self._callback = cb
        // retreives file info and inits upload on complete
        fs.stat(self.file_path, function (error, stats) {
            self.total_bytes = stats.size
            self.upload_init();
        });
    }

    upload_init() {
        console.log('INIT');
        var self = this;

        const form_data = {
            'command': 'INIT',
            'media_type': 'video/mp4',
            'total_bytes': self.total_bytes,
            'media_category': 'tweetvideo'
        }

        // inits media upload
        request.post({
            url: MEDIA_ENDPOINT_URL,
            oauth: OAUTH,
            formData: form_data
        }, function (error, response, body) {
            const data = JSON.parse(body)
            // store media ID for later reference
            self.media_id = data.media_id_string;

            // start appening media segments
            self.upload_append();
        });
    }

    upload_append() {
        var buffer_length = 5000000;
        var buffer = new Buffer(buffer_length);
        var bytes_sent = 0;
    
        var self = this;
    
        // open and read video file
        fs.open(self.file_path, 'r', function (error, file_data) {
    
            var bytes_read, data,
                segment_index = 0,
                segments_completed = 0;
    
            // upload video file in chunks
            while (bytes_sent < self.total_bytes) {
    
                console.log('APPEND');
    
                bytes_read = fs.readSync(file_data, buffer, 0, buffer_length, null);
                data = bytes_read < buffer_length ? buffer.slice(0, bytes_read) : buffer;
    
                var form_data = {
                    command: 'APPEND',
                    media_id: self.media_id,
                    segment_index: segment_index,
                    media_data: data.toString('base64')
                };
    
                request.post({
                    url: MEDIA_ENDPOINT_URL,
                    oauth: OAUTH,
                    formData: form_data
                }, function () {
                    segments_completed = segments_completed + 1;
    
                    console.log('segment_completed');
                    if (segments_completed == segment_index) {
                        console.log('Upload chunks complete');
                        self.upload_finalize();
                    }
                });
    
                bytes_sent = bytes_sent + buffer_length;
                segment_index = segment_index + 1;
            }
        });
    }
    upload_finalize() {
        console.log('FINALIZE');

        var self = this;
    
        const form_data = {
            'command': 'FINALIZE',
            'media_id': self.media_id
        }
    
        // finalize uploaded chunck and check processing status on compelete
        request.post({
            url: MEDIA_ENDPOINT_URL,
            oauth: OAUTH,
            formData: form_data
        }, function (error, response, body) {
            const data = JSON.parse(body)
            self.check_status(data.processing_info);
        });
    }

    check_status(processing_info) {
        var self = this;
        // if response does not contain any processing_info, then video is ready
        if (!processing_info) {
            self.tweet();
            return;
        }
    
        console.log('STATUS');
    
        const request_params = {
            'command': 'STATUS',
            'media_id': self.media_id
        }
    
        // check processing status 
        request.get({
            url: MEDIA_ENDPOINT_URL,
            oauth: OAUTH,
            qs: request_params
        }, function (error, response, body) {
    
            const data = JSON.parse(body)
    
            // console.log('Media processing status is ' + processing_info.state);
    
            if (processing_info.state == 'succeeded') {
                self.tweet();
                return
            } else if (processing_info.state == 'failed') {
                self._callback(new Error("Failed"), null)
                return;
            }
    
            // check status again after specified duration
            var timeout_length = data.processing_info.check_after_secs ? data.processing_info.check_after_secs * 1000 : 0;
    
            console.log('Checking after ' + timeout_length + ' milliseconds');
    
            setTimeout(function () {
                self.check_status(data.processing_info)
            }, timeout_length);
        });
    }
    tweet() {
        var self = this;

        const request_data = {
            'status': self.tweet_text,
            'media_ids': self.media_id
        }
    
        // publish Tweet
        request.post({
            url: POST_TWEET_URL,
            oauth: OAUTH,
            form: request_data
        }, function (error, response, body) {
            if (!error) {
                const data = JSON.parse(body)
                // console.log(data);
                return self._callback(null, data)
            } else {
                return self._callback(error, null)
            }
        });
    }
}

module.exports = VideoTweet