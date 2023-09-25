// Импортируем необходимые функции
const { fetchData, resetFlags } = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log')


// Функция для уведомления одного пользователя о некомментированных задачах
// Общие вспомогательные функции

async function sendMessage(chatId, message) {
    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
        // console.log(`Notify. Message sent to chatId: ${chatId}`)
    } catch (error) {
        console.error(`Notify. Failed to send message to chatId: ${chatId}`, error)
    }
}

async function updateTaskStatus(id_task) {
    const updateUrl = `${WEB_API}/comment/update.php?id_task=${id_task}&sent=1&access_key=${SECRET_KEY}`
    try {
        const response = await fetch(updateUrl)
        if (response.ok) {
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

    return `<b>Пожалуйста, прокомментируйте следующую операцию:</b><code>(1/${total})</code>\n\n` +
        `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `<b>Брак:</b> <code>${kolvo_brak}</code>\n` +
        `<b>Контроль:</b> <code>${typeString}</code>\n` +
        `<b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
        `<b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `<b>Дата:</b> <code>${date}</code>\n\n` +
        `task_ID: <code>${id_task}</code>\n\n` +
        `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`
}

// Первая функция

async function notifyAllUsers() {
    const allComments = await fetchComments()
    const data = await fetchData(`${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`)
    const user_ids = [...new Set(data.comments.map(comment => comment.user_id))]

    for (const chatId of user_ids) {
        // Фильтрация комментариев для текущего пользователя
        const userComments = allComments.filter(comment => comment.user_id === chatId && comment.sent === 0)

        // Если нет комментариев для текущего пользователя, продолжаем следующую итерацию
        if (userComments.length === 0) continue

        const message = formatMessage(userComments[0], userComments.length) // Используем userComments.length для подсчета количества сообщений для текущего пользователя
        await sendMessage(chatId, message + "\n<code>Cron</code>")
        await updateTaskStatus(userComments[0].id_task)
    }
}

// Вторая функция

async function notifyUsers(ctx) {
    await sendToLog(ctx);
    if (ctx.chat.type !== 'private') return;
    resetFlags(ctx);
    const chatId = ctx.message.chat.id;
    // const isUserInitiated = ctx.session.isUserInitiated || false; // Получаем флаг из сессии


    try {
        // Получаем список некомментированных задач для данного пользователя
        const uncommentedTasks = await fetchComments(chatId);

        // Проверяем, есть ли задачи для текущего пользователя
        const isUserInList = uncommentedTasks.some(task => task.user_id === chatId);

        if (!isUserInList) {
            ctx.session.isUserInitiated = false; // Сбрасываем флаг
            return sendMessage(chatId, 'Пустые комментарии не найдены.');
        }

        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId);
        if (userActualComments.length === 0) return;

        await sendMessage(LOG_CHANNEL_ID, `Отправлено пользователю <code>${chatId} </code>`);

        const message = formatMessage(userActualComments[0], userActualComments.length);
        sendMessage(chatId, message);

        await updateTaskStatus(userActualComments[0].id_task);
        // ctx.session.isUserInitiated = false; // Сбрасываем флаг
    } catch (error) {
        console.log('Notify Error in notifyUsers:', error);
        await sendMessage(LOG_CHANNEL_ID, `Notify <code>${error} </code>`);
    }
}


// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
