'use strict'

const Fs = require('fs')  
const Path = require('path')  
const Axios = require('axios')

async function downloadFile (videoUrl, videoName) {

  const url = videoUrl
  const filePath = Path.resolve('downloads', videoName);
  const writer = Fs.createWriteStream(filePath)

  // axios image download with response type "stream"
  const response = await Axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  })

  // pipe the result stream into a file on disc
  response.data.pipe(writer)

  // return a promise and resolve when download finishes
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  });

}

module.exports = downloadFile