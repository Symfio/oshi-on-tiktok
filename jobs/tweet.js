const Queue = require('bull')
const fs = require('fs')
const {tweet_with_video, tweet} = require('../util/Tweet')
const download = require('../util/download')
const {Feed} = require('../models')
const path = require('path')
const appDir = path.dirname(require.main.filename)

const queue = new Queue('tweetQueue', process.env.REDIS_URI)

queue.process(5, async function(job, done){
    const data = job.data
    if(data.videoMeta.duration > 140) {
        return done(new Error('Video too long'))
    }
    const mediaPath = appDir + '/downloads/' + data.id + '.mp4'
    download(data.videoUrl, mediaPath).then(() => {
        console.log("Video Downloaded")
        const username = data.authorMeta.name
        tweet_with_video(`Update from [${username}]`, mediaPath).then(async(t) => {
            await tweet(`Download disini: ${process.env.DOWNLOAD_SERVICE_URL}/${username}/${data.id}`, t.id_str)
            const result = {
                tiktok_id: data.id,
                text: data.text,
                author_id: data.authorMeta.id,
                author_name: username,
                video_url: data.videoUrl,
                tiktok_createTime: data.createTime,
                videoPath: mediaPath
            }
            return done(null, result)
        }).catch(err => done(new Error(err)))
    }).catch(err => done(new Error(err)))
    
});

queue.on('progress', function(job, progress) {
    // console.log(`Job ${job.data.id} is ${progress * 100}% ready!`);
});

queue.on('completed', async function(job, result){
    console.log(`${job.data.id} COMPLETED`)
    Feed.create(result)
    try {
        setTimeout(function() {
            fs.unlinkSync(result.videoPath)
        }, 2000)
    } catch (error) {}
    job.remove()
});
queue.on('failed', function(job, err){
    console.error(err)
    const mediaPath = appDir + '/downloads/' + job.data.id + '.mp4'
    try {
        setTimeout(function() {
            fs.unlinkSync(mediaPath)
        }, 2000)
    } catch (error) {}
    job.remove()
});


module.exports = queue