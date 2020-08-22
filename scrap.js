require('dotenv').config();
process.env.TZ = 'Asia/Jakarta';
const TikTokScraper = require('tiktok-scraper');
// const queue = require('./jobs/tweet');
const {Feed} = require('./models');
const { USERNAME_LIST } = require('./constants');
const Promise = require('bluebird');

const scrap = async (username, channel) => {
    // User feed by username
    console.info(`[*] GET DATA ${username}`);
    const posts = await TikTokScraper.user(username, { number: 3 });
    const post_collectors = Object.assign([], posts.collector).reverse();
    await Promise.map(post_collectors, async data => {
        const exist = await Feed.countDocuments({
            tiktok_id: data.id
        });
        if(exist > 0) return;
        try {
            if(process.env.WITHOUT_WATERMARK) {
                data = await TikTokScraper.getVideoMeta(`https://www.tiktok.com/@${data.authorMeta.name}/video/${data.id}`).then(meta => {
                    meta.authorMeta = {...data.authorMeta};
                    channel.publish({
                        username: data.authorMeta.name,
                        data: meta
                    }, 'tiktok48');
                    return meta;
                }).catch(err => {});
            } else {
                channel.publish({
                    username: data.authorMeta.name,
                    data
                }, 'tiktok48');
            }
            // console.log(data.id + " ADDED to Queue")
            // queue.add(data, { delay: 5000 })
            const dataSave = {
                tiktok_id: data.id,
                author_id: data.authorMeta.id,
                author_name: data.authorMeta.name,
                tiktok_createTime: data.createTime
            };
            await Feed.create(dataSave);
            return data;
        } catch (error) {
            return null;
        }
    }, {concurrency: 1});
    await Promise.delay(2000);
    return true;    
}


const run = (channel) => {
    return Promise.each(USERNAME_LIST, async (username, index) => {
        await scrap(username, channel);
        if(index >= USERNAME_LIST.length -1) {
            console.log("Delay 10 sec");
            await Promise.delay(10 * 1000);
            return run(channel);
        }
        return index;
    })
}

module.exports = run;
