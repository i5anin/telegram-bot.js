const { resetFlags, formatPaymentDate, getUserName, getDescription, getDefectType, getControlType } = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log')
const { updateComment } = require('#src/api/index')
const { formatSKMessage } = require('#src/utils/ru_lang')

// Функция задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Асинхронная функция для отправки сообщений
async function sendMessage(chatId, message) {
    await sleep(250)
    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
        return true
    } catch (error) {
        console.error(`Notify. Ошибка при отправке сообщения chatId: ${chatId}`, error)
        if (error.code === 400 && error.description === 'Bad Request: chat not found') {
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Чат не найден: <code>${chatId}</code>`, { parse_mode: 'HTML' })
        }
        return false
    }
}

// Обновление статуса задачи
async function updateTaskStatus(id_task) {
    try {
        const response = await updateComment(id_task)
        console.log(`Notify. ${response && response.status === 'OK' ? 'Статус задачи успешно обновлен' : 'Ошибка обновления статуса задачи:' + response.status}`)
    } catch (error) {
        console.log('Notify. Ошибка при обновлении статуса задачи:', error)
    }
}

function formatMessage(comment, total) {
    const { id_task, kolvo_brak, det_name, type, comments_otk, specs_nom_id } = comment
    const typeString = getDescription(type)
    const { formattedDate } = formatPaymentDate({ date: comment.date })
    const controlDescription = getControlType(type[0]);
    const defectDescription = getDefectType(type[1]);
    return `<b>Пожалуйста, прокомментируйте на следующих деталях:</b><code>(1/${total})</code>\n\n` +
        formatSKMessage(det_name, kolvo_brak, controlDescription, defectDescription, comments_otk, specs_nom_id, formattedDate) +
        `task_ID: <code>${id_task}</code>\n\n` +
        `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`
}

// Обработка комментариев пользователя
async function processUserComments(userComments, userName) {
    const chatId = userComments[0].user_id
    const message = formatMessage(userComments[0], userComments.length)
    const isMessageSent = await sendMessage(chatId, message)

    if (isMessageSent) {
        const masterChatId = userComments[0].user_id_master
        if (masterChatId) {
            const masterMessage = formatMasterMessage(userComments[0], chatId, userName)
            await sendMessage(masterChatId, masterMessage)
        }
        await updateTaskStatus(userComments[0].id_task)
    }
}

// Форматирование сообщения для мастера
function formatMasterMessage(comment, chatId, userName) {
    const { det_name, kolvo_brak, type, comments_otk, specs_nom_id } = comment
    const typeString = getDescription(type)
    const { formattedDate } = formatPaymentDate({ date: comment.date })
    const controlDescription = getControlType(type[0]);
    const defectDescription = getDefectType(type[1]);
    return `<b>Мастер, Вам уведомление</b>\n` +
        formatSKMessage(det_name, kolvo_brak, controlDescription, defectDescription, comments_otk, specs_nom_id, formattedDate)
}

// Уведомление всех пользователей
async function notifyAllUsers() {
    const allComments = await fetchComments()
    const user_ids = [...new Set(allComments.map(comment => comment.user_id))]

    for (const chatId of user_ids) {
        const userName = await getUserName(chatId) // Перемещено сюда
        const userComments =
            allComments.filter(comment => comment.user_id === chatId && comment.sent === 0)
        if (userComments.length > 0) {
            await processUserComments(userComments, userName)
        }
    }
}

// Уведомление пользователей
async function notifyUsers(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return

    resetFlags(ctx)
    const chatId = ctx.message.chat.id

    const userName = await getUserName(chatId)
    const uncommentedTasks = await fetchComments(chatId)

    const userUnansweredComments =
        uncommentedTasks.filter(({ user_id, sent }) => user_id === chatId && sent === 0)

    if (userUnansweredComments.length > 0) {
        await processUserComments(userUnansweredComments, userName)
    } else {
        await sendMessage(chatId, 'Пустые комментарии не найдены.')
    }
}


module.exports = { notifyUsers, notifyAllUsers }
