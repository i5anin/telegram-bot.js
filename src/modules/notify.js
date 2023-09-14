// Импортируем необходимые функции
const fetchData = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log')

// Функция для уведомления одного пользователя о некомментированных задачах
async function notifyUsers(ctx) {
    const chatId = ctx.message.chat.id // Получаем ID чата из контекста сообщения
    await sendToLog(ctx)
    try {
        // Получаем список некомментированных задач для данного пользователя
        const uncommentedTasks = await fetchComments(chatId)

        // Проверяем, есть ли какие-либо некомментированные задачи
        if (!uncommentedTasks || uncommentedTasks.length === 0) {
            const errorMessage = uncommentedTasks ? 'Пустые комментарии не найдены.' : 'Произошла ошибка при получении комментариев.'
            return bot.telegram.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' })
        }

        // Фильтруем задачи, оставляем только те, которые принадлежат текущему пользователю
        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId)

        // Если нет задач, которые нужно комментировать, выходим из функции
        if (userActualComments.length === 0) return

        // Формируем сообщение для пользователя
        const { id_task, kolvo_brak, det_name, date } = userActualComments[0]
        const message = `Пожалуйста, прокомментируйте следующую операцию:`
            + `<code>(1/${userActualComments.length})</code>\n\n`
            + `Название и обозначение:\n<code>${det_name}</code>\n`
            + `Брак: <code>${kolvo_brak}</code>\n`
            + `Дата: <code>${date}</code>\n`
            + `ID: <code>${id_task}</code>`
        // Отправляем сообщение
        ctx.session.userComments = userActualComments[0]
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Увеличиваем счетчик сообщений
        stateCounter.message++

    } catch (error) {
        // Логируем ошибку, если что-то пошло не так
        console.log('Error in notifyUsers:', error)
    }
    ctx.session.isAwaitComment = true
}

// Функция для уведомления всех пользователей
async function notifyAllUsers(ctx) {
    const allComments = await fetchComments() // Получаем все комментарии
    const data = await fetchData(USER_API + '/get_all.php') // Получаем всех пользователей

    // Проверяем, получены ли данные корректно
    if (!data || !data.hasOwnProperty('user_ids')) {
        console.log('The server response did not contain \'user_ids\'')
        return
    }

    // Проходимся по всем пользователям и уведомляем их
    for (const chatId of data.user_ids) {
        // if (userStates.get(chatId)) continue // Если у пользователя уже есть задача для комментирования, пропускаем

        const userComments = allComments.filter(comment => comment.user_id === chatId)
        if (userComments.length === 0) continue

        // Формируем и отправляем сообщение
        const { id_task, kolvo_brak, det_name, date } = userComments[0]
        const message = `Вам нужно прокомментировать следующую задачу:`
            + `<code>(1/${userComments.length})</code>\n\n`
            + `Название и обозначение:\n<code>${det_name}</code>\n`
            + `Брак: <code>${kolvo_brak}</code>\n`
            + `Дата: <code>${date}</code>\n`
            + `ID: <code>${id_task}</code>\n`
            + `<code>Cron</code>`
        ctx.session.userComments = userComments[0]
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Увеличиваем счетчик сообщений cron
        stateCounter.cronMessage++

        // Устанавливаем статус ожидания комментария для пользователя
        ctx.session.isAwaitComment = true
    }
}

// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
