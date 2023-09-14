const fetchData = require('#src/utils/helpers')
const axios = require('axios')

//fetchComments
async function fetchComments() {
    const url = COMMENT_API + '/get_all.php?key=' + SECRET_KEY
    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error('Сетевой запрос не удался')
        }

        const data = await response.json()

        if (data && data.comments) {
            return data.comments
        } else {
            throw new Error('Не удалось получить комментарии')
        }

    } catch (error) {
        console.log(`Произошла ошибка: ${error}`)
        return null
    }
}

// Функция для добавления комментария в базу MySQL
async function handleAddComment(ctx) {

    if (!ctx) {
        console.log('Context is undefined!');
        return;
    }

    const chatId = ctx.message.chat.id;

    if (ctx.session.isAwaitComment) {
        // const userComment = ctx.message.text;

        const url = `${COMMENT_API}/update.php`;
        const params = {
            id_task: ctx.session.id_task,
            comment: ctx.message.text,
            access_key: SECRET_KEY  // если нужен ключ доступа
        };

        try {
            const response = await axios.get(url, { params });
            if (response.data.status === 'OK') {
                await bot.telegram.sendMessage(
                    chatId,
                    `Комментарий:\n<code>${ctx.message.text}</code>\nДля:\n<code>${ctx.session.userComments.det_name}</code>\nдобавлен успешно.`,
                    { parse_mode: 'HTML' }
                );
                ctx.session.isAwaitComment = false;
            } else {
                throw new Error('Ошибка на стороне сервера');
            }
        } catch (error) {
            await bot.telegram.sendMessage(
                LOG_CHANNEL_ID,
                `Ошибка при добавлении комментария:\n${error}`,
                { parse_mode: 'HTML' }
            );
            // console.log(`Ошибка при добавлении комментария:\n${error}`);
            console.log("Axios Error:", error, error.response && error.response.data);
            ctx.session.isAwaitComment = true;
            
        }
    }
}

module.exports = {
    fetchComments,
    handleAddComment,
}