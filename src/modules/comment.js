const axios = require('axios');

//fetchComments
async function fetchComments() {
    const url = `${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`;
    try {
        const response = await axios.get(url);
        if (response.data && response.data.comments) {
            return response.data.comments;
        } else {
            throw new Error('Не удалось получить комментарии');
        }
    } catch (error) {
        console.log(`${url} Произошла ошибка: ${error}`);
        return null;
    }
}

// Функция для добавления комментария в базу MySQL
async function handleAddComment(ctx) {
    console.log("+ handleAddComment(ctx)")
    // Проверка наличия контекста, сообщения и reply_to_message
    if (!ctx || !ctx.message || !ctx.message.reply_to_message) {
        console.log('Context or message or reply_to_message is undefined!');
        return;
    }

    const chatId = ctx.message.chat.id; // Получаем ID чата
    const botUsername = ctx.botInfo.username; // Получаем username бота

    // Проверяем, совпадает ли ID пользователя с сохраненным в сессии
    if (chatId !== ctx.session.userComments.user_id) {
        console.log('Несоответствие пользователей!');
        return;
    }

    // Проверяем, является ли исходное сообщение сообщением от нашего бота
    if (ctx.message.reply_to_message.from.username !== botUsername) {
        console.log('Сообщение не от нашего бота!');
        return;
    }

    // Извлекаем task_ID из reply_to_message
    const taskIDText = ctx.message.reply_to_message.text || '';
    const match = taskIDText.match(/task_ID: (\d+)/); // Используем регулярное выражение для поиска task_ID

    if (match) {
        const taskID = match[1]; // Извлекаем task_ID
        const comments = await fetchComments(); // Загружаем все комментарии

        if (!comments) {
            console.log('Could not fetch comments.');
            return;
        }

        // Ищем соответствующий комментарий в загруженных данных
        const comment = comments.find(c => c.id_task == taskID && c.user_id == chatId);

        if (!comment) {
            console.log('Не найдено ни одного подходящего комментария');
            return;
        }

        // Формируем параметры для API запроса
        const url = `${WEB_API}/comment/update.php`;
        const params = {
            id_task: ctx.session.id_task,
            comment: ctx.message.text,
            access_key: SECRET_KEY,
        };

        try {
            // Отправляем запрос на сервер для обновления комментария
            const response = await axios.get(url, { params });
            if (response.data.status === 'OK') {
                // Подтверждаем успешное добавление комментария
                await ctx.reply(
                    `Комментарий:\n<code>${ctx.message.text}</code>\nДля:\n<code>${ctx.session.userComments.det_name}</code>\nдобавлен успешно.`,
                    { parse_mode: 'HTML' },
                );
                ctx.session.isAwaitComment = false; // Сбрасываем флаг ожидания комментария
            } else {
                throw new Error('Ошибка на стороне сервера');
            }
        } catch (error) {
            // Логируем ошибку и отправляем уведомление в канал логов
            await ctx.telegram.sendMessage(
                LOG_CHANNEL_ID,
                `Ошибка при добавлении комментария:\n${error}`,
                { parse_mode: 'HTML' },
            );
            console.log('Axios Error:', error, error.response && error.response.data);
            ctx.session.isAwaitComment = true; // Устанавливаем флаг ожидания комментария
        }
    } else {
        console.log('Invalid task_ID format in the reply message!');
    }
}


module.exports = {
    fetchComments,
    handleAddComment,
};
