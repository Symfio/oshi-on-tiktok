module.exports = (mongoose) => {
    var Schema = mongoose.Schema({
        tiktok_id : Number,
        text: String,
        author_id: Number,
        author_name: String,
        video_url: String,
        created_at: { 
            type: Date,
            default: new Date
        },
        tiktok_createTime: { 
            type: Date,
            default: null
        }
    });
    
    // mongoose.Promise = global.Promise;
    
    const Feed = mongoose.model('Feed', Schema);
    return Feed;
}