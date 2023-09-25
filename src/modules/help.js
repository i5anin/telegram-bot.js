const fs = require('fs')
const { sendToLog } = require('#src/utils/log')

async function handleHelpCommand(ctx) {
    await sendToLog(ctx);

    // Получаем аргументы после команды
    const input = ctx.message.text.split(' ');
    const userId = input[1] ? parseInt(input[1]) : null;

    // Проверяем, является ли отправитель администратором и был ли предоставлен аргумент
    if (userId && String(ctx.from.id) === GRAND_ADMIN) {
        // Отправляем справку пользователю с userId
        try {
            const userChatId = userId;
            await sendHelpToUser(ctx, userChatId);
        } catch (err) {
            console.error('Error sending help to user:', err);
        }
    } else if (!userId) {
        // Если аргумент не предоставлен, отправляем справку отправителю
        await sendHelpToUser(ctx, ctx.chat.id);
    }
}

async function sendHelpToUser(ctx, chatId) {
    // Формируем и отправляем справку пользователю с указанным chatId
    const photo = fs.createReadStream('src/media/answer.jpg');
    const video = fs.createReadStream('src/media/answer.mp4'); // Убедитесь, что путь к файлу верный
    const messageJpg = `Доступные команды:

1. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>
· телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
· пк: правой кнопкой мыши <u>ответить</u>

2. /docs - Посмотреть полезные документы и ссылки

Для регистрации подойдите в отдел <b>IT</b>

В случае ошибки напишите разработчику @i5anin Сергей.`;

    await ctx.telegram.sendPhoto(chatId, { source: photo }, {
        caption: messageJpg,
        parse_mode: 'HTML',
    });

    // Отправка видео
    await ctx.telegram.sendVideo(chatId, { source: video });
}

async function handleDocsCommand(ctx) {
    ctx.reply('Вот несколько полезных ссылок:\n' +
        '- [Общая Штатная папка](https://drive.google.com/drive/folders/1y5W8bLSrA6uxMKBu_sQtJp7simhDExfW)\n' +
        '- [Должностная папка оператора](https://drive.google.com/drive/folders/1ZmouCoENMzQ7RZxhpmAo-NeZmAanto0V)',
        { parse_mode: 'Markdown' })
}

module.exports = { handleHelpCommand, handleDocsCommand }
