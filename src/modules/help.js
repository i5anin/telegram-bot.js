const fs = require('fs');
async function handleHelpCommand(ctx) {
    // https://imgbb.su/image/0bD7OR
    // sendToLog(ctx);

    // Отправка фото из файла
    const photo = fs.createReadStream('src/img/answer.jpg');
    await ctx.replyWithPhoto({ source: photo });

    // Отправка текста
    await ctx.reply(`Доступные команды:
    
1. /reg - Регистрация пользователя
Шаблон: <code>Иванов И.И.</code>
· один пробел между фамилией и инициалами
· между инициалами пробел не нужен

2. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>

В случае ошибки напишите разработчику @i5anin Сергей.`, { parse_mode: 'HTML' });
}

module.exports = { handleHelpCommand };
