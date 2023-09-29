// Импортируем необходимые функции
const { resetFlags } = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log')
const { formatPaymentDate } = require('#src/utils/helpers')
const { updateComment } = require('#src/api/index')


// Функция для уведомления одного пользователя о некомментированных задачах
// Общие вспомогательные функции

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendMessage(chatId, message) {
    await sleep(500)
    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
        return true // Возвращаем true, если сообщение отправлено успешно
    } catch (error) {
        console.error(`Notify. Failed to send message to chatId: ${chatId}`, error)
        if (error.code === 400 && error.description === 'Bad Request: chat not found') {
            // Отправляем сообщение об ошибке в канал для логирования
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Чат не найден: <code>${chatId}</code>`, { parse_mode: 'HTML' })
        }
        return false // Возвращаем false, если произошла ошибка
    }
}

async function updateTaskStatus(id_task) {
    try {
        const response = await updateComment(id_task)
        if (response && response.status === 'OK') {
            console.log('Notify. Task status updated successfully')
        } else {
            console.log('Notify. Failed to update task status:', response.status)
        }
    } catch (error) {
        console.log('Notify. Error while updating task status:', error)
    }
}


function formatMessage(comment, total) {
    const typeMapping = {
        'ПО': 'Пооперационный контроль окончательный',
        'ПН': 'Пооперационный контроль неокончательный',
        'УО': 'Контроль перед упаковкой окончательный',
        'УН': 'Контроль перед упаковкой неокончательный',
    }
    const { id_task, kolvo_brak, det_name, date, specs_nom_id, type, comments_otk } = comment
    const typeString = typeMapping[type] || 'Неизвестный тип'
    const { formattedDate } = formatPaymentDate({ date: comment.date })

    return `<b>Пожалуйста, прокомментируйте следующую операцию:</b><code>(1/${total})</code>\n\n` +
        `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `<b>Брак:</b> <code>${kolvo_brak}</code>\n` +
        `<b>Контроль:</b> <code>${typeString}</code>\n` +
        `<b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
        `<b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `<b>Дата:</b> <code>${formattedDate}</code>\n\n` +
        `task_ID: <code>${id_task}</code>\n\n` +
        `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`
}

// Первая функция

async function notifyAllUsers() {
    const allComments = await fetchComments()

    if (!allComments) {
        console.error('Не удалось получить комментарии')
        return
    }

    const user_ids = [...new Set(allComments.map(comment => comment.user_id))]

    for (const chatId of user_ids) {
        try {
            const userComments = allComments.filter(comment => comment.user_id === chatId && comment.sent === 0)

            if (userComments.length === 0) continue

            const message = formatMessage(userComments[0], userComments.length)
            const isMessageSent = await sendMessage(chatId, message + '\n<code>Cron</code>')

            if (!isMessageSent) continue

            await updateTaskStatus(userComments[0].id_task)
            await sendMessage(LOG_CHANNEL_ID, `<code>Cron</code> Отправлено пользователю <code>${chatId}</code> task_ID: <code>${userComments[0].id_task}</code>\n`)
        } catch (error) {
            console.error(`Ошибка при отправке сообщения пользователю ${chatId}:`, error)
            await sendMessage(LOG_CHANNEL_ID, `Чат не найден для chatId: <code>${chatId}</code>`)
        }
        await sleep(500)
    }
}

// Вторая функция

async function notifyUsers(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    resetFlags(ctx)
    const chatId = ctx.message.chat.id

    try {
        const uncommentedTasks = await fetchComments(chatId)

        if (!uncommentedTasks) {
            console.error('Не удалось получить комментарии.')
            await sendMessage(chatId, 'Произошла ошибка при получении комментариев.')
            await sendMessage(LOG_CHANNEL_ID, `<code>${chatId}</code> Произошла ошибка при получении комментариев.`)
            return
        }

        const isUserInList = uncommentedTasks.some(task => task.user_id === chatId)

        if (!isUserInList) {
            ctx.session.isUserInitiated = false
            await sendMessage(chatId, 'Пустые комментарии не найдены.')
            await sendMessage(LOG_CHANNEL_ID, `<code>${chatId}</code> Пустые комментарии не найдены.`)
            return
        }

        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId)
        if (userActualComments.length === 0) return

        const taskId = userActualComments[0].id_task
        await sendMessage(LOG_CHANNEL_ID, `Отправлено пользователю <code>${chatId} </code> task_ID: <pre>${taskId}</pre>`)
        const message = formatMessage(userActualComments[0], userActualComments.length)
        const isMessageSent = await sendMessage(chatId, message)

        if (isMessageSent) {
            await updateTaskStatus(userActualComments[0].id_task)
        }
    } catch (error) {
        console.log('Notify Error in notifyUsers:', error)
        await sendMessage(LOG_CHANNEL_ID, `Notify <code>${error}</code>`)
    }
}


// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
