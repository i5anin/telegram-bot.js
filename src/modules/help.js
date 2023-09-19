// Функция для обработки команды /help
const { sendToLog } = require('#src/utils/admin') // Добавление лога

function handleHelpCommand(ctx) {
    sendToLog(ctx)
    ctx.reply(`Доступные команды:

- /start: Начать работу с ботом и регистрация
- /reg: Регистрация пользователя
<code>Иванонв И.И.
       ^ - 1 пробел
(между инициалами, пробел не нужен)</code>
- /new_comment: Получить новые комментарии
прокоментировать задачу стого через <u>ответить</u>

В случае ошибки напишите мне @i5anin.`, { parse_mode: 'HTML' });
}

module.exports = { handleHelpCommand };