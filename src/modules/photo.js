const { checkUser } = require('#src/api/index')
const path = require('path')
const fs = require('fs')
const request = require('request')
const BOT_TOKEN = process.env.BOT_TOKEN

async function handlePhoto(ctx) {
    // Проверяем, есть ли фотографии в сообщении
    if (ctx.message.photo && ctx.message.photo.length > 0) {
        // Выбираем последнюю фотографию в массиве, которая является самой большой
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const photoFileId = photo.file_id;
        const photoInfo = await ctx.telegram.getFile(photoFileId);
        const caption = ctx.message.caption;

        // Проверяем наличие подписи
        if (!caption) {
            ctx.reply('Извините, подпись к фотографии обязательна.\nПопробуйте снова с подписью.');
            return;
        }

        const currentDate = new Date()
            .toISOString()
            .replace(/:/g, '_')
            .replace(/\.\d+Z$/, '');
        const fileName = `${currentDate}_${ctx.from.id}.jpg`;

        // Проверяем, зарегистрирован ли пользователь
        const userData = await checkUser(ctx.from.id);

        if (userData.exists) {
            // Пользователь зарегистрирован, можно продолжить сохранение фотографии
            const filePath = path.join('D:', 'db_photo', fileName);
            const fileStream = fs.createWriteStream(filePath);
            const url =
                `https://api.telegram.org/file/bot${BOT_TOKEN}/${photoInfo.file_path}`;
            const request = require('request');

            // Загружаем фотографию в локальную директорию
            request(url).pipe(fileStream);

            ctx.reply('Фотография успешно сохранена.');
        } else {
            // Пользователь не зарегистрирован, обработка ошибки
            ctx.reply('Извините, вы не зарегистрированы. Обратитесь к администратору.');
        }
    } else {
        ctx.reply('Извините, я ожидал фотографию. Попробуйте снова.');
    }
}

module.exports = {handlePhoto}