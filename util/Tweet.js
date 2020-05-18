const Twit = require('twit')
const T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})
const fs = require('fs')
const VideoTweet = require('./VIdeoChunk')

const tweet = (text, reply_status_id = null) => {
    return new Promise((resolve, reject) => {
        var dataTwit = reply_status_id ? {
            status: text,
            in_reply_to_status_id: reply_status_id
        } : {
            status: text
        }
        T.post('statuses/update', dataTwit, function (err, data, response) {
            if (!err) {
                console.log("---------------")
                console.log("Tweet Sent: " + reply_status_id ? reply_status_id : data.id_str)
                console.log("Type: " + reply_status_id ? "Parent" : "Child")
                if (reply_status_id) console.log("Parent Tweet ID: " + data.id_str)
                console.log("---------------")
                resolve(data)
            } else {
                reject(err)
            }
        })
    })
}

const tweet_with_video = (text, mediaPath) => {
    // mediaData = fs.readFileSync(mediaPath);
    return new Promise((resolve, reject) => {
        console.log(mediaPath)
        if(!fs.existsSync(mediaPath)) {
            return reject("File not found")
        }
        return T.postMediaChunked({
            file_path: mediaPath
        }, function (err, data, response) {
            if (err) {
                console.error(err)
                return reject(err)
            }
            const mediaIdStr = data.media_id_string;
            const params = {
                status: text,
                media_ids: [mediaIdStr]
            };
            T.post("statuses/update", params, function (err, data, response) {
                if (!err) {
                    console.log("Tweet SENT " + data.id_str)
                    resolve(data)
                } else {
                    console.error(err)
                    reject(err)
                }
            })
        })
    })
}

module.exports = {
    T,
    tweet,
    tweet_with_video,
    VideoTweet
}