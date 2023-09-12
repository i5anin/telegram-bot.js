// Подключаем необходимые модули и переменные
const axios = require('axios');
const ruLang = require('#src/utils/ru_lang');  // Локализация сообщений

// Функция для проверки, зарегистрирован ли пользователь на сервере
async function checkRegistration(chatId) {
    const url = `${USER_API}/get.php?id=${chatId}`;  // Формируем URL для запроса
    try {
        const response = await axios.get(url);  // Делаем GET-запрос на сервер
        // Проверяем, существует ли пользователь в базе данных
        if (response.data.exists === true) {
            return true;  // Если да, возвращаем true
        }
        return false;  // Если нет, возвращаем false
    } catch (error) {
        return false;  // В случае ошибки также возвращаем false
    }
}

// Функция обработки команды "/reg"
// Асинхронная функция для обработки команды регистрации
module.exports = async function handleRegComment(ctx, state) {
    const chatId = ctx.message.chat.id;  // Получаем ID чата
    const isRegistered = await checkRegistration(chatId);  // Проверяем регистрацию
    const { chat } = ctx.message;

    // Если чат не является чатом администратора, отправляем лог
    if (chat.id !== parseInt(GRAND_ADMIN)) await sendToLog(ctx);

    // Отправляем соответствующее сообщение на основе статуса регистрации
    if (isRegistered) {
        // Если пользователь уже зарегистрирован
        ctx.reply(ruLang.alreadyRegistered, { parse_mode: 'HTML' });
        state.isAwaitFio = false;  // Отключаем ожидание ФИО
    } else {
        // Если пользователь не зарегистрирован
        ctx.reply(ruLang.notRegistered, { parse_mode: 'HTML' });
        state.isAwaitFio = true;  // Включаем ожидание ФИО
    }
}