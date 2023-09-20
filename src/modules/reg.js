// Подключаем необходимые модули и переменные
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')  // Локализация сообщений
const { sendToLog } = require('#src/utils/admin') // Добавление лога
// const { handleTextCommand } = require('#src/modules/text')  // Обработка текстовых сообщений

// Функция для проверки, зарегистрирован ли пользователь на сервере
async function checkRegistration(chatId) {
    const url = `${WEB_API}/users/get.php?id=${chatId}`
    try {
        const response = await axios.get(url)
        return {
            exists: response.data.exists === true,
            fio: response.data.fio,
        }
    } catch (error) {
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, `\n<code>${error}</code>`, { parse_mode: 'HTML' })
        return { exists: false, fio: null }
    }
}

// Асинхронная функция для обработки команды регистрации
async function handleRegComment(ctx) {
    const chatId = ctx.message.chat.id
    const { chat } = ctx.message

    await sendToLog(ctx)

    const registrationData = await checkRegistration(chatId)
    const isRegistered = registrationData.exists
    const fio = registrationData.fio

    let textToReply
    if (isRegistered && fio) {
        textToReply = `<code>${fio}</code> <b>Вы уже зарегистрированы!</b>`
    } else {
        textToReply = ruLang.notRegistered
    }
    ctx.session.isAwaitFio = !isRegistered

    // Отправляем сообщение
    ctx.reply(textToReply, { parse_mode: 'HTML' })
}

module.exports = { handleRegComment }
