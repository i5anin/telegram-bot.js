const { checkUser } = require('#src/api/index')
const path = require('path')
const fs = require('fs')
const request = require('request')
const BOT_TOKEN = process.env.BOT_TOKEN
const axios = require('axios')

async function handlePhoto(ctx) {
    const photos = ctx.message.photo

    // Check if photos are present
    if (!photos || photos.length === 0) {
        ctx.reply('Извините, я ожидал фотографию. Попробуйте снова.')
        return
    }

    // Check if user is registered
    const userData = await checkUser(ctx.from.id)
    if (!userData.exists) {
        ctx.reply('Извините, вы не зарегистрированы. Обратитесь к администратору.')
        return
    }

    // If user is registered and photos are present, process each photo
    for (const [index, photo] of photos.entries()) {
        const photoFileId = photo.file_id
        const photoInfo = await ctx.telegram.getFile(photoFileId)

        const currentDate = new Date().toISOString().replace(/:/g, '_').replace(/\.\d+Z$/, '')
        const fileName = `${currentDate}_${ctx.from.id}_${index}.jpg`
        const filePath = path.join('D:', 'db_photo', fileName)
        const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${photoInfo.file_path}`

        // Save photo to local directory
        const response = await axios.get(url, { responseType: 'stream' })
        const fileStream = fs.createWriteStream(filePath)
        response.data.pipe(fileStream)
    }

    ctx.reply('Пожалуйста, введите номер партии.')
    ctx.session.photoParty = true
}

module.exports = { handlePhoto }








