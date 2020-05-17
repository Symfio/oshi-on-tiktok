require('dotenv').config()
process.env.TZ = 'Asia/Jakarta'
const TikTokScraper = require('tiktok-scraper')
const queue = require('./jobs/tweet')
const {Feed} = require('./models')

const { USERNAME_LIST } = require('./constants')

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const eventStream = async (username) => {
    console.info("Listen to "+ username)
    const users = TikTokScraper.userEvent(username, { 
        number: 1
    })
    users.on('data', json => {
        Feed.countDocuments({
            tiktok_id: json.id
        }).then(exist => {
            if(exist > 0) return
            console.log(json.id + " ADDED to Queue")
            queue.add(json)
        })
    });
    users.on('done', () => {
        console.log(`${username} CONNECTED`)
    });
    users.on('error', error => {
        console.error(`${username} ${error}`)
    });
    users.scrape();
}

const run = async (username) => {
    // User feed by username
    const posts = await TikTokScraper.user(username, { number: 1 });
    posts.collector.forEach(data => {
        Feed.countDocuments({
            tiktok_id: data.id
        }).then(exist => {
            if(exist > 0) return
            console.log(data.id + " ADDED to Queue")
            queue.add(data)
        })
    })
    console.log("OK")
}

(() => {
    try {
        USERNAME_LIST.forEach((username, index) => {
            sleep(10000 * index).then(() => eventStream(username))
        })
    } catch (error) {
        console.log(error)
    }
})();

console.info("[*] Service is Running, Press CTRL+C to stop.")