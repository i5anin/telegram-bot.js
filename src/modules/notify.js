// Импортируем необходимые функции
const fetchData = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')

// Функция для уведомления одного пользователя о некомментированных задачах
async function notifyUsers(ctx) {
    const chatId = ctx.message.chat.id // Получаем ID чата из контекста сообщения

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
        const { id_task, name, description, date } = userActualComments[0]
        const message = `Пожалуйста, прокомментируйте следующую операцию:\n<code>(1/${userActualComments.length})</code>\nНазвание: <code>${name}</code>\nОбозначение: <code>${description}</code>\nДата: <code>${date}</code>\nid: <code>${id_task}</code>`

        // Отправляем сообщение
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Увеличиваем счетчик сообщений
        stateCounter.message++

    } catch (error) {
        // Логируем ошибку, если что-то пошло не так
        console.log('Error in notifyUsers:', error)
    }
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
        const { id_task, name, description, date } = userComments[0]
        const message = `<code>Cron</code>\nВам нужно прокомментировать следующую задачу:\n<code>(1/${userComments.length})</code>\nНазвание: <code>${name}</code>\nОбозначение: <code>${description}</code>\nДата: <code>${date}</code>\nID: <code>${id_task}</code>`
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Увеличиваем счетчик сообщений cron
        stateCounter.cronMessage++

        // Устанавливаем статус ожидания комментария для пользователя
        ctx.session.isAwaitingComment = true
    }

    // Устанавливаем флаг, что ожидание комментариев включено
    ctx.session.isAwaitComment = true
}

// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
