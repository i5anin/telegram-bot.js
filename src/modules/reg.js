// Подключаем необходимые модули и переменные
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')  // Локализация сообщений
const { sendToLog } = require('#src/utils/log') // Добавление лога
const { handleTextCommand } = require('#src/modules/text')  // Обработка текстовых сообщений


// Функция для проверки, зарегистрирован ли пользователь на сервере
async function checkRegistration(chatId) {
    const url = `${USER_API}/get.php?id=${chatId}`
    try {
        const response = await axios.get(url)
        return response.data.exists === true  // Возвращаем результат сразу
    } catch (error) {
        return false
    }
}

// Асинхронная функция для обработки команды регистрации
async function handleRegComment(ctx) {
    const chatId = ctx.message.chat.id
    const { chat } = ctx.message

    // Ранний выход, если чат НЕ является чатом администратора
    if (chat.id !== parseInt(GRAND_ADMIN)) await sendToLog(ctx)

    const isRegistered = await checkRegistration(chatId)

    // Определяем, какой текст и статус должны быть установлены
    const textToReply = isRegistered ? ruLang.alreadyRegistered : ruLang.notRegistered
    ctx.session.isAwaitFio = !isRegistered;

    // Отправляем сообщение
    ctx.reply(textToReply, { parse_mode: 'HTML' })
}

module.exports = { handleRegComment }
