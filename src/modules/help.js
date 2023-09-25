const fs = require('fs')
const { sendToLog } = require('#src/utils/log')
const axios = require('axios')

async function getUserInfo(userId) {
    try {
        // Запрашиваем данные всех пользователей
        const response = await axios.get(`${WEB_API}/users/get_all_fio.php`);

        // Ищем пользователя с заданным userId в полученных данных
        const user = response.data.users_data.find(u => u.user_id === userId);

        if (user) {
            // Если пользователь найден, возвращаем его данные
            return {
                userId: user.user_id,
                fio: user.fio,
            };
        } else {
            // Если пользователь не найден, выбрасываем ошибку или возвращаем undefined/null
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        throw error;
    }
}

async function handleHelpCommand(ctx) {
    await sendToLog(ctx);

    const input = ctx.message.text.split(' ');
    const userId = input[1] ? parseInt(input[1]) : null;

    if (userId && String(ctx.from.id) === GRAND_ADMIN) {
        try {
            const userChatId = userId;
            await sendHelpToUser(ctx, userChatId);

            // Если sendMessage прошло успешно, здесь можно получить информацию о пользователе и отправить сообщение администратору.
        } catch (err) {
            console.error('Error sending help to user:', err);
            await ctx.reply('Не удалось отправить сообщение пользователю. Возможно, пользователь не начал чат с ботом.');
        }
    } else if (!userId) {
        try {
            await sendHelpToUser(ctx, ctx.chat.id);
        } catch (err) {
            console.error('Error sending help to sender:', err);
            await ctx.reply('Произошла ошибка при отправке справки.');
        }
    }
}

async function sendHelpToUser(ctx, chatId) {
    try {
        const photo = fs.createReadStream('src/media/answer.jpg');
        const video = fs.createReadStream('src/media/answer.mp4');
        const messageJpg = `Доступные команды:

1. /new_comment - Получить новые комментарии
· прокомментировать задачу через <u>ответить</u>
· телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
· пк: правой кнопкой мыши <u>ответить</u>

2. /docs - Посмотреть полезные документы

Для регистрации подойдите в отдел <b>IT</b>

В случае ошибки напишите разработчику @i5anin Сергей.`; // Ваше сообщение

        await ctx.telegram.sendPhoto(chatId, { source: photo }, {
            caption: messageJpg,
            parse_mode: 'HTML',
        });
        await ctx.telegram.sendVideo(chatId, { source: video });
    } catch (err) {
        console.error('Error in sendHelpToUser:', err);
        throw err; // Перебрасываем ошибку для обработки в handleHelpCommand
    }
}

async function handleDocsCommand(ctx) {
    ctx.reply('Вот несколько полезных ссылок:\n' +
        '- [Общая Штатная папка](https://drive.google.com/drive/folders/1y5W8bLSrA6uxMKBu_sQtJp7simhDExfW)\n' +
        '- [Должностная папка оператора](https://drive.google.com/drive/folders/1ZmouCoENMzQ7RZxhpmAo-NeZmAanto0V)',
        { parse_mode: 'Markdown' })
}

module.exports = { handleHelpCommand, handleDocsCommand }
