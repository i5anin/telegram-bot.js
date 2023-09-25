const axios = require('axios')

//fetchComments
async function fetchComments() {
    const url = `${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`
    try {
        const response = await axios.get(url)
        if (response.data && response.data.comments) {
            return response.data.comments
        } else {
            throw new Error('Не удалось получить комментарии')
        }
    } catch (error) {
        console.log(`${url} Произошла ошибка: ${error}`)
        return null
    }
}

async function handleAddComment(ctx) {
    if (!ctx || !ctx.message || !ctx.message.reply_to_message) {
        console.log('Context or message or reply_to_message is undefined!')
        return
    }

    const chatId = ctx.message.chat.id
    // const botUsername = ctx.botInfo.username

    // Определение переменных username, firstName и lastName
    const username = ctx.from.username || 'N/A'
    const firstName = ctx.from.first_name || 'N/A'
    const lastName = ctx.from.last_name || 'N/A'

    const taskText = ctx.message.reply_to_message.text || ''

    // Извлекаем task_ID и название с обозначением
    const matchTaskID = taskText.match(/task_ID: (\d+)/)
    const matchDetName = taskText.match(/Название и обозначение:\n(.+?)\n/)

    if (matchTaskID && matchDetName) {
        const taskID = matchTaskID[1]
        const detName = matchDetName[1]

        ctx.session.userComments = { ...ctx.session.userComments, det_name: detName }

        const comments = await fetchComments()

        if (!comments) {
            console.log('Could not fetch comments.')
            return
        }

        const comment = comments.find(c => c.id_task === Number(taskID) && c.user_id === chatId)

        if (!comment) {
            await bot.telegram.sendMessage(chatId, 'Ошибка! задача уже прокомментирована')
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Ошибка! задача уже прокомментирована\ntaskID: <code>${taskID}</code>\nchatId: <code>${chatId}</code>`, { parse_mode: 'HTML' })
            console.log('Не найдено ни одного подходящего комментария') //Не найдено ни одного подходящего комментария на который
            return
        }

        const url = `${WEB_API}/comment/update.php`
        console.log('taskID=ctx.message.text=SECRET_KEY' + taskID + ' ' + ctx.message.text + ' ' + SECRET_KEY)
        const params = {
            id_task: taskID,
            comments_op: ctx.message.text,
            access_key: SECRET_KEY,
        }

        try {
            const response = await axios.get(url, { params })

            if (response.data.status === 'OK') {
                await ctx.reply(
                    `Комментарий:\n<code>${ctx.message.text}</code>\nДля:\n<code>${ctx.session.userComments.det_name}</code>\nдобавлен успешно.`,
                    { parse_mode: 'HTML' },
                )
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `${emoji.star.repeat(3)} Успешно прокомментировал задачу\n Пользователь с ID <code>${chatId}</code>` +
                    ` @${username}` +
                    `\nИмя: <code>${firstName} ${lastName}</code>` +
                    `\nКомментарий:\n<code>${ctx.message.text}</code>`,
                    { parse_mode: 'HTML' },
                )
            } else {
                throw new Error('Ошибка на стороне сервера')
            }
        } catch (error) {
            await ctx.telegram.sendMessage(
                LOG_CHANNEL_ID,
                `Ошибка при добавлении комментария:\n${error}`,
                { parse_mode: 'HTML' },
            )
            console.log('Comment Axios Error:', error, error.response && error.response.data)
        }
    } else {
        console.log('Invalid task_ID format or missing detName in the reply message!')
    }
}


module.exports = {
    fetchComments,
    handleAddComment,
}
