const fs = require('fs')
const { sendToLog } = require('#src/utils/log')

async function handleHelpCommand(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    // Отправка фото из файла с подписью (caption)
    const photo = fs.createReadStream('src/media/answer.jpg')
    const video = fs.createReadStream('src/media/answer.mp4')
    const messageJpg =
        `Доступные команды:

1. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>
· телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
· пк: правой кнопкой мыши <u>ответить</u>

2. /docs - Посмотреть полезные документы и ссылки

Для регистрации подойдите в отдел <b>IT</b>

В случае ошибки напишите разработчику @i5anin Сергей.`
    await ctx.replyWithPhoto({ source: photo }, {
        caption: messageJpg,
        parse_mode: 'HTML', // Опционально, если вы хотите использовать HTML-разметку в подписи
    })
    // Отправка видео
    await ctx.replyWithVideo({ source: video })
}

async function handleDocsCommand(ctx) {
    ctx.reply('Вот несколько полезных ссылок:\n' +
        '- [Общая Штатная папка](https://drive.google.com/drive/folders/1y5W8bLSrA6uxMKBu_sQtJp7simhDExfW)\n' +
        '- [Должностная папка оператора](https://drive.google.com/drive/folders/1ZmouCoENMzQ7RZxhpmAo-NeZmAanto0V)',
        { parse_mode: 'Markdown' })
}

module.exports = { handleHelpCommand, handleDocsCommand }
