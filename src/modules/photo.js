const { checkUser } = require('#src/api/index') // Предположим, что ваша функция для добавления фото называется addPhotoData
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const BOT_TOKEN = process.env.BOT_TOKEN

async function handlePhoto(ctx) {
  if (ctx.chat.type !== 'private') return
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

  // Select the photo with the highest resolution (last in the array)
  const maxResolutionPhoto = photos[photos.length - 1]
  const photoFileId = maxResolutionPhoto.file_id
  const photoInfo = await ctx.telegram.getFile(photoFileId)

  const currentDate = new Date()
    .toISOString()
    .replace(/:/g, '_')
    .replace(/\.\d+Z$/, '')
  const fileName = `${currentDate}_${ctx.from.id}.jpg`
  const filePath = path.join('D:', 'bot', 'db_photo', fileName)
  ctx.session.filePath = filePath
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${photoInfo.file_path}`

  // Ensure the directory exists
  if (!fs.existsSync(path.join('D:', 'db_photo')))
    fs.mkdirSync(path.join('D:', 'db_photo'), { recursive: true })

  // Save the photo to the local directory
  const response = await axios.get(url, { responseType: 'stream' })
  const fileStream = fs.createWriteStream(filePath)
  response.data.pipe(fileStream)
  response.data.on('end', () => {
    fileStream.close()
  })

  ctx.reply('Пожалуйста, введите номер партии.')
  ctx.session.photoParty = true
}

export { handlePhoto }
