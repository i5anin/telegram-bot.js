const fs = require('fs')
const { sendToLog } = require('#src/utils/log')

async function handleHelpCommand(ctx) {
    await sendToLog(ctx)
    // Отправка фото из файла с подписью (caption)
    const photo = fs.createReadStream('src/media/answer.jpg')
    const video = fs.createReadStream('src/media/answer.mp4')
    const messageJpg = `Доступные команды:
    
1. /reg - Регистрация пользователя
Шаблон: <code>Иванов И.И.</code>
· один пробел между фамилией и инициалами
· между инициалами пробел не нужен

2. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>
· телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
· пк: правой кнопкой мыши <u>ответить</u>

В случае ошибки напишите разработчику @i5anin Сергей.`
    await ctx.replyWithPhoto({ source: photo }, {
        caption: messageJpg,
        parse_mode: 'HTML', // Опционально, если вы хотите использовать HTML-разметку в подписи
    })
    // Отправка видео
    await ctx.replyWithVideo({ source: video })
}

module.exports = { handleHelpCommand }
