// Функция для проверки регистрации пользователя на Сервере
// Проверка регистрации пользователя
const axios = require('axios');
// const GRAND_ADMIN = process.env.GRAND_ADMIN

const ruLang = require('./ru_lang')

async function checkRegistration(chatId) {
    const url = `${USER_API}/get.php?id=${chatId}`
    try {
        const response = await axios.get(url)
        if (response.data.exists === true) {
            return true
        }
        return false
    } catch (error) {
        return false
    }
}

// ! reg
module.exports = async function handleRegComment(ctx, state) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    const { chat } = ctx.message
    if (chat.id !== parseInt(GRAND_ADMIN)) await sendToLog(ctx)
    if (isRegistered) {
        ctx.reply(ruLang.alreadyRegistered, { parse_mode: 'HTML' })
        state.isAwaitFio  = false
    } else {
        ctx.reply(ruLang.notRegistered, { parse_mode: 'HTML' })
        state.isAwaitFio  = true
    }
}

