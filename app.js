require('dotenv').config()
process.env.TZ = 'Asia/Jakarta'
const TikTokScraper = require('tiktok-scraper')
const queue = require('./jobs/tweet')
const {Feed} = require('./models')
const cron = require('node-cron')
const { USERNAME_LIST } = require('./constants')
const Promise = require('bluebird')
const CRON_EXPRESSION = process.env.CRON_EXPRESSION || "*/5 * * * *"

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
    console.info(`[*] GET DATA ${username}`)
    const posts = await TikTokScraper.user(username, { number: 2 });
    const post_collectors = Object.assign([], posts.collector).reverse();
    Promise.map(post_collectors, async data => {
        const exist = await Feed.countDocuments({
            tiktok_id: data.id
        })
        if(exist > 0) return
        if(process.env.WITHOUT_WATERMARK) {
            await sleep(1000)
            data = await TikTokScraper.getVideoMeta(`https://www.tiktok.com/@${data.authorMeta.name}/video/${data.id}`).then(meta => {
                meta.authorMeta = {...data.authorMeta}
                console.log("VIDEO noWatermark OK")
                return meta
            })
        }
        console.log(data.id + " ADDED to Queue")
        queue.add(data, { delay: 5000 })
    })
}

(() => {
    cron.schedule(CRON_EXPRESSION, () => {
        try {
            USERNAME_LIST.forEach((username, index) => {
                sleep(8000 * index).then(() => run(username))
            })
        } catch (error) {
            console.log(error)
        }
    })
})();

console.info("[*] Service is Running, Press CTRL+C to stop.")