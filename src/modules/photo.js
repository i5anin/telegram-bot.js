const { checkUser } = require('#src/api/index')
const path = require('path')
const fs = require('fs')
const request = require('request')
const BOT_TOKEN = process.env.BOT_TOKEN

async function handlePhoto(ctx) {
    // Проверяем, есть ли фотографии в сообщении
    if (ctx.message.photo && ctx.message.photo.length > 0) {
        const caption = ctx.message.caption
        // Проверяем, зарегистрирован ли пользователь
        const userData = await checkUser(ctx.from.id)
        if (userData.exists) {
            // Пользователь зарегистрирован, можно продолжить сохранение фотографии
            for (let i = 0; i < ctx.message.photo.length; i++) {
                const photo = ctx.message.photo[i]
                // Проверяем, существует ли фотография
                if (photo && photo.length > 0) {
                    // Выбираем самую большую версию фотографии
                    const photoFileId = photo[photo.length - 1].file_id
                    const photoInfo = await ctx.telegram.getFile(photoFileId)

                    const currentDate = new Date().toISOString().replace(/:/g, '_').replace(/\.\d+Z$/, '')
                    const fileName = `${currentDate}_${ctx.from.id}_${i}.jpg`

                    const filePath = path.join('D:', 'db_photo', fileName)
                    const fileStream = fs.createWriteStream(filePath)
                    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${photoInfo.file_path}`

                    // Загружаем фотографию в локальную директорию
                    request(url).pipe(fileStream)
                    ctx.session.photoParty = true
                    // Send a message only once
                    // ctx.reply(`Фотографии успешно сохранены. Всего обработано: ${ctx.message.photo.length}`);
                    ctx.reply('Пожалуйста, введите номер партии.');
                    return;  // Return to prevent further processing
                }
            }

            // Отправляем сообщение только после того, как все фотографии были обработаны
            // ctx.reply(`Фотографии успешно сохранены. Всего обработано: ${ctx.message.photo.length}`)
            ctx.reply('Пожалуйста, введите номер партии.')
            ctx.session.photoParty = true
        } else {
            // Пользователь не зарегистрирован, обработка ошибки
            ctx.reply('Извините, вы не зарегистрированы. Обратитесь к администратору.')
        }
    } else {
        ctx.reply('Извините, я ожидал фотографию. Попробуйте снова.')
    }
}

module.exports = { handlePhoto }








