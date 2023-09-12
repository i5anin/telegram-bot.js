const fetchData = require('#src/utils/helpers');

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
async function handleAddComment(ctx, userStates, bot) {
    if (!ctx) {
        console.log('Context is undefined!')
        return
    }

    const chatId = ctx.message.chat.id
    const userState = userStates.get(chatId)

    if (userState && userState.isAwaitingComment) {
        const userComment = ctx.message.text

        try {
            await fetchData(COMMENT_API + `/update.php`, {
                id_task: userState.taskId,
                comment: userComment,
            }) // ! Обновить комментарий
            await bot.telegram.sendMessage(
                chatId,
                'Комментарий добавлен успешно.',
                { parse_mode: 'HTML' },
            )
            userStates.set(chatId, { isAwaitingComment: false, taskId: null }) // Обновляем состояние пользователя
        } catch (error) {
            await bot.telegram.sendMessage(
                chatId,
                'Ошибка при добавлении комментария: ' + error,
                { parse_mode: 'HTML' },
            )
            console.log('Ошибка при добавлении комментария:', error)
            userStates.set(chatId, {
                isAwaitingComment: true,
                taskId: userState.taskId,
            }) // Обновляем состояние пользователя
        }
    } else {
        console.log('No comment is awaited from this user at the moment.')
        // нет комментариев в этот момент ошибка при регистрации
    }
}

module.exports = {
    fetchComments,
    handleAddComment
};