// Функция для обработки команды /help
const { sendToLog } = require('#src/utils/admin') // Добавление лога

function handleHelpCommand(ctx) {
    sendToLog(ctx)
    ctx.reply(`Доступные команды:

- /start: Начать работу с ботом и регистрация
- /reg: Регистрация пользователя
- /new_comment: Получить новые комментарии

В случае ошибки напишите мне @i5anin.`);
}

module.exports = { handleHelpCommand };