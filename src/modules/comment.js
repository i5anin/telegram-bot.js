const { getAllComments, updateComment } = require('#src/api/index')
const { formatPaymentDate, getDescription, getUserName } = require('#src/utils/helpers')


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
        console.log('Context or message or reply_to_message is undefined!')
        return
    }

    const chatId = ctx.message.chat.id

    const username = ctx.from.username ? '@' + ctx.from.username : '';
    const firstName = ctx.from.first_name || 'N/A'
    const lastName = ctx.from.last_name || 'N/A'

    const taskText = ctx.message.reply_to_message.text || ''

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
            await bot.telegram.sendMessage(chatId, 'Задача уже прокомментирована')
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Задача уже прокомментирована\ntaskID: <code>${taskID}</code>\nchatId: <code>${chatId}</code>`, { parse_mode: 'HTML' })
            console.log('Не найдено ни одного подходящего комментария')
            return
        }

        const commentText = ctx.message.text
        const response = await updateComment(taskID, commentText)

        if (response && response.status === 'OK') {
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
            const { id_task, kolvo_brak, det_name, type, comments_otk, specs_nom_id } = comment;
            const typeString = getDescription(type);
            const { formattedDate } = formatPaymentDate({ date: comment.date });
            const userName = await getUserName(chatId);
            const master_msg = `<b>Прокомментировал</b> <code>${userName}</code> ${username}\n\n` +
                `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
                `<b>Брак:</b> <code>${kolvo_brak}</code>\n` +
                `<b>Контроль:</b> <code>${typeString}</code>\n` +
                `<b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
                `<b>Партия:</b> <code>${specs_nom_id}</code>\n` +
                `<b>Дата:</b> <code>${formattedDate}</code>\n\n` +
                `<b>Комментарий:</b> <code>${commentText}</code>`

            // Если user_id_master существует, отправляем сообщение мастеру
            if (comment.user_id_master) await bot.telegram.sendMessage(comment.user_id_master, master_msg, { parse_mode: 'HTML' })

        } else {
            console.error('Ошибка на стороне сервера:', response.message || response.errorMessage || 'Неизвестная ошибка')
            throw new Error('Ошибка на стороне сервера')
        }
    } else {
        console.log('Invalid task_ID format or missing detName in the reply message!')
    }
}

module.exports = { fetchComments, handleAddComment }
