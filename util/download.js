'use strict'

const Fs = require('fs')  
const Path = require('path')  
const Axios = require('axios')

async function downloadFile (videoUrl, mediaPath) {

  const url = videoUrl
  const path = Path.resolve(mediaPath)
  const writer = Fs.createWriteStream(path)

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