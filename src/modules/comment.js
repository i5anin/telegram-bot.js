const fetchData = require('#src/utils/helpers')

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
    console.log('\n--- handleAddComment --- Функция для добавления комментария в базу MySQL ' + ctx.message.chat.id + '\n')

    if (!ctx) {
        console.log('Context is undefined!')
        return
    }

    const chatId = ctx.message.chat.id
    // const userState = userStates.get(chatId)

    console.log('ctx.session.isAwaitComment = ' + ctx.session.isAwaitComment)
    console.log('ctx.message.text = ' + ctx.message.text)

    if (ctx.session.isAwaitComment) {

        console.log('добавить для ' + ctx.message.chat.id)
        console.log('сообщение ' + ctx.message.chat.id)
        console.log('ctx.session.id ' + ctx.session.id)
        console.log('ctx.message.text ' + ctx.message.text)

        const userComment = ctx.message.text
        console.log('ctx.session.isAwaitComment = ', ctx.session.isAwaitComment)
        try {
            await fetchData(COMMENT_API + `/update.php`, {
                params: {
                    id_task: ctx.session.id,
                    comment: ctx.message.text,
                    access_key: SECRET_KEY // если нужен ключ доступа
                }
            });
            await bot.telegram.sendMessage(
                chatId,
                `Комментарий:\n<code>${ctx.message.text}</code>\nДля:\n<code>${ctx.session.userComments.det_name}</code>\nдобавлен успешно.`,
                { parse_mode: 'HTML' },
            )
            ctx.session.isAwaitComment = false
            // userStates.set(chatId, { isAwaitComment: false, taskId: null }) // Обновляем состояние пользователя
        } catch (error) {
            await bot.telegram.sendMessage(
                chatId,
                'Ошибка при добавлении комментария:\n' + error,
                { parse_mode: 'HTML' },
            )
            console.log('Ошибка при добавлении комментария:\n', error)
            // userStates.set(chatId, {
            ctx.session.isAwaitComment = true
            //     taskId: userState.taskId,
            // }) // Обновляем состояние пользователя
        }
    }
    // else {
    //     console.log('No comment is awaited from this user at the moment.')
    //     // нет комментариев в этот момент ошибка при регистрации
    // }
}

module.exports = {
    fetchComments,
    handleAddComment,
}