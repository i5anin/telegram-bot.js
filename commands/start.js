// commands/start.js
const checkRegistration = require('../helpers/checkRegistration') // Предположим, что у вас есть такая функция в helpers
const messages = require('../messages') // Предположим, что у вас есть такой файл с сообщениями

module.exports = async (ctx) => {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}
