// Функция для обработки команды /help
function handleHelpCommand(ctx) {
    ctx.reply(`Доступные команды:

- /start: Начать работу с ботом и регистрация
- /reg: Регистрация пользователя
- /new_comment: Получить новые комментарии

В случае ошибки напишите мне @i5anin.`);
}

module.exports = { handleHelpCommand };