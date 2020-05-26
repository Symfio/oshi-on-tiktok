'use strict'

const fs = require('fs')
const path = require('path')
const request = require('request');
const progress = require('request-progress');
const { promisify } = require('util')
const rp = promisify(request)

function downloadFile(videoUrl, fileName) {
	return new Promise(async(resolve, reject) => {
		const filePath = path.resolve('downloads', fileName)
		
		if(process.env.WITHOUT_WATERMARK) {
			videoUrl = await rp(videoUrl, {
				followRedirect: true,
				maxRedirects: 1,
				headers: {
					'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36'
				}
			}).then(r => r.a.request.uri.href)
		}
		
		return progress(request(videoUrl), {
			// throttle: 5000,                    // Throttle the progress event to 2000ms, defaults to 1000ms 
			// delay: 5000,                       // Only start to emit after 1000ms delay, defaults to 0ms 
			// lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length 
		})
		.on('progress', function (state) {
			// The state is an object that looks like this: 
			// { 
			//     percent: 0.5,               // Overall percent (between 0 to 1) 
			//     speed: 554732,              // The download speed in bytes/sec 
			//     size: { 
			//         total: 90044871,        // The total payload size in bytes 
			//         transferred: 27610959   // The transferred payload size in bytes 
			//     }, 
			//     time: { 
			//         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals) 
			//         remaining: 81.403       // The remaining seconds to finish (3 decimals) 
			//     } 
			// } 
			console.log('progress', state.percent);
		})
		.on('error', function (err) {
			reject(err)
		})
		.on('end', function () {
			resolve()
		})
		.pipe(fs.createWriteStream(filePath));
	});
}

module.exports = downloadFile