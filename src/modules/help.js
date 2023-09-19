// Функция для обработки команды /help
const { sendToLog } = require('#src/utils/admin') // Добавление лога

function handleHelpCommand(ctx) {
    sendToLog(ctx)
    ctx.reply(`Доступные команды:
    
1. /reg - Регистрация пользователя
Шаблон: <code>Иванов И.И.</code>
· один пробел между фамилией и инициалами
· между инициалами пробел не нужен

2. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>

В случае ошибки напишите разработчику @i5anin Сергей.`, { parse_mode: 'HTML' })
}

module.exports = { handleHelpCommand }