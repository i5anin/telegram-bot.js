const axios = require('axios')
const { getAllComments, updateComment } = require('#src/api/index')

//fetchComments
async function fetchComments() {
    try {
        const response = await getAllComments()
        if (response && response.comments) {
            return response.comments
        } else {
            throw new Error('Не удалось получить комментарии')
        }
    } catch (error) {
        console.error(`Произошла ошибка: ${error}`)
        return null
    }
}

async function handleAddComment(ctx) {
    if (!ctx || !ctx.message || !ctx.message.reply_to_message) {
        console.log('Context or message or reply_to_message is undefined!');
        return;
    }

    const chatId = ctx.message.chat.id;

    // Определение переменных username, firstName и lastName
    const username = ctx.from.username || 'N/A';
    const firstName = ctx.from.first_name || 'N/A';
    const lastName = ctx.from.last_name || 'N/A';

    const taskText = ctx.message.reply_to_message.text || '';

    // Извлекаем task_ID и название с обозначением
    const matchTaskID = taskText.match(/task_ID: (\d+)/);
    const matchDetName = taskText.match(/Название и обозначение:\n(.+?)\n/);

    if (matchTaskID && matchDetName) {
        const taskID = matchTaskID[1];
        const detName = matchDetName[1];

        ctx.session.userComments = { ...ctx.session.userComments, det_name: detName };

        const comments = await fetchComments();

        if (!comments) {
            console.log('Could not fetch comments.');
            return;
        }

        const comment = comments.find(c => c.id_task === Number(taskID) && c.user_id === chatId);

        if (!comment) {
            await bot.telegram.sendMessage(chatId, 'Ошибка! задача уже прокомментирована');
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Ошибка! задача уже прокомментирована\ntaskID: <pre>${taskID}</pre>\nchatId: <code>${chatId}</code>`, { parse_mode: 'HTML' });
            console.log('Не найдено ни одного подходящего комментария');
            return;
        }

        // Используем текст сообщения как комментарий при вызове функции updateComment
        const commentText = ctx.message.text;
        const response = await updateComment(taskID, commentText);

        if (response && response.status === 'OK') {
            await ctx.reply(
                `Комментарий:\n<pre>${ctx.message.text}</pre>\nДля:\n<pre>${ctx.session.userComments.det_name}</pre>\nдобавлен успешно.`,
                { parse_mode: 'HTML' },
            );
            await bot.telegram.sendMessage(
                LOG_CHANNEL_ID,
                `${emoji.star.repeat(3)} Успешно прокомментировал задачу\n Пользователь с ID <code>${chatId}</code>` +
                ` @${username}` +
                `\nИмя: <pre>${firstName} ${lastName}</pre>` +
                `\nКомментарий:\n<pre>${ctx.message.text}</pre>`,
                { parse_mode: 'HTML' },
            );
        } else {
            console.error('Ошибка на стороне сервера:', response.message || response.errorMessage || 'Неизвестная ошибка');
            throw new Error('Ошибка на стороне сервера');
        }
    } else {
        console.log('Invalid task_ID format or missing detName in the reply message!');
    }
}


module.exports = { fetchComments, handleAddComment }
