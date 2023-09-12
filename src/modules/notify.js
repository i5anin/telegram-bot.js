const fetchData = require('#src/utils/helpers')
const { fetchComments } = require('./comment');
// Функция для уведомления пользователей о комментариях
module.exports = async function notifyUsers(ctx, bot, state) {
    const chatId = ctx.message.chat.id

    try {
        // Здесь мы передаем chatId в функцию fetchComments
        const uncommentedTasks = await fetchComments(chatId)

        // Обработка различных сценариев ошибок или пустого массива
        if (!uncommentedTasks || uncommentedTasks.length === 0) {
            const errorMessage = uncommentedTasks ? 'Пустые комментарии не найдены.' : 'Произошла ошибка при получении комментариев.'
            if (userInitiated || !uncommentedTasks) {
                return bot.telegram.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' })
            }
            return
        }

        const userActualComments = uncommentedTasks.filter(
            ({ user_id }) => user_id === chatId,
        )

        // Установим currentTaskId теперь, когда мы уверены, что он нужен
        const currentTaskId = userActualComments[0]?.id_task

        // Готовим и отправляем сообщение
        const message = `Пожалуйста, прокомментируйте следующую операцию:\n` +
            `<code>(1/${userActualComments.length})</code>\n` +
            `Название: <code>${userActualComments[0]?.name}</code>\n` +
            `Обозначение: <code>${userActualComments[0]?.description}</code>\n` +
            `Дата: <code>${userActualComments[0]?.date}</code>\n` +
            `id: <code>${currentTaskId}</code>`

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Если у вас есть счётчик сообщений pm2, вы можете инкрементировать его здесь
        state.messageCounter++

    } catch (error) {
        console.log('Error in notifyUsers:', error)
    }
}

// Функция для уведомления ВСЕХ пользователей
async function notifyAllUsers() {
    // Загружаем все комментарии с внешнего источника
    const allComments = await fetchComments()

    // Запрашиваем список всех пользователей с сервера
    const data = await fetchData(USER_API + '/get_all.php') // Получить список пользователей /get_user_id.php повторяется

    // Проверяем, правильно ли получены данные
    if (!data || !data.hasOwnProperty('user_ids')) {
        console.log('The server response did not contain \'user_ids\'')
        return
    }

    // Получаем массив всех пользователей
    const allUsers = data.user_ids

    // Цикл по всем пользователям
    for (const chatId of allUsers) {
        // Если у пользователя уже ожидается комментарий, пропускаем его
        if (userStates.get(chatId)) continue

        // Фильтруем комментарии, оставляем только те, что принадлежат текущему пользователю
        const userComments = allComments.filter(
            (comment) => comment.user_id === chatId,
        )

        // Если у пользователя есть комментарии
        if (userComments.length > 0) {
            // Возьмем первый комментарий для дальнейшей обработки
            const comment = userComments[0]
            // Формируем сообщение для пользователя
            let message =
                '<code>Cron</code>\nВам нужно прокомментировать следующую задачу:\n' +
                `<code>(1/${userComments.length})</code>\n` +
                `Название: <code>${comment.name}</code>\n` +
                `Обозначение: <code>${comment.description}</code>\n` +
                `Дата: <code>${comment.date}</code>\n` +
                `ID: <code>${comment.id_task}</code>`

            // Формируем сообщение для пользователя
            await bot.telegram.sendMessage(chatId, message, {
                parse_mode: 'HTML',
            })

            // Увеличиваем счетчик отправленных cron сообщений
            state.cronMessageCounter++

            // Устанавливаем состояние ожидания комментария от пользователя
            userStates.set(chatId, {
                isAwaitingComment: true,
                taskId: comment.id_task,
            })
        }
    }
    // Устанавливаем флаг, что ожидание комментария включено
    state.isAwaitComment = true
}
