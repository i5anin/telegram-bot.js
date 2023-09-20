// Импортируем необходимые функции
const fetchData = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/admin')


// Функция для уведомления одного пользователя о некомментированных задачах
async function notifyUsers(ctx) {
    console.log('notifyUsers')
    const chatId = ctx.message.chat.id // Получаем ID чата из контекста сообщения
    await sendToLog(ctx)
    try {
        // Получаем список некомментированных задач для данного пользователя
        const uncommentedTasks = await fetchComments(chatId)
        // Проверяем, есть ли какие-либо некомментированные задачи
        if (!uncommentedTasks || uncommentedTasks.length === 0) {
            // const errorMessage = 'Пустые комментарии не найдены.';
            const errorMessage = uncommentedTasks ? 'Пустые комментарии не найдены.' : 'Пустые комментарии не найдены.'
            try {
                return bot.telegram.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' })
            } catch (error) {
                console.log('Error sending message:', error)
            }

        }

        // Фильтруем задачи, оставляем только те, которые принадлежат текущему пользователю
        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId)

        // Если нет задач, которые нужно комментировать, выходим из функции
        if (userActualComments.length === 0) return

        // Формируем сообщение для пользователя
        const { id_task, kolvo_brak, det_name, date, specs_nom_id, type } = userActualComments[0]

        const typeMapping = {
            'ПО': 'Пооперационный контроль окончательный',
            'ПН': 'Пооперационный контроль неокончательный',
            'УО': 'Контроль перед упаковкой окончательный',
            'УН': 'Контроль перед упаковкой неокончательный',
        }

        const typeString = typeMapping[type] || 'Неизвестный тип'

        const message = `<b>Пожалуйста, прокомментируйте следующую операцию:</b>`
            + `<code>(1/${userActualComments.length})</code>\n\n`
            + `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n`
            + `<b>Брак:</b> <code>${kolvo_brak}</code>\n`
            + `<b>Контроль:</b> <code>${typeString}</code>\n`
            + `<b>Партия:</b> <code>${specs_nom_id}</code>\n`
            + `<b>Дата:</b> <code>${date}</code>\n\n`
            + `task_ID: <code>${id_task}</code>\n`
            + `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`
        // Отправляем сообщение
        ctx.session.userComments = userActualComments[0]
        ctx.session.id_task = id_task
        // console.log('ctx.session.id_task = ', ctx.session.id_task)
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Выполняем HTTP-запрос для обновления статуса задачи
        const updateUrl = `${WEB_API}/comment/update.php?id_task=${id_task}&sent=1&access_key=${SECRET_KEY}`
        console.log('updateUrl = ', updateUrl)
        try {
            const response = await fetch(updateUrl) // или await axios.get(updateUrl);
            if (response.ok) {
                console.log('Task status updated successfully')
            } else {
                console.log('Failed to update task status:', response.status)
            }
        } catch (error) {
            console.log('Error while updating task status:', error)
        }


        // Увеличиваем счетчик сообщений
        stateCounter.message++

    } catch (error) {
        // Логируем ошибку, если что-то пошло не так
        console.log('Error in notifyUsers:', error)
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `\n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
    ctx.session.isAwaitComment = true
}

// Вспомогательная функция для создания задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

let sentTaskIds = []

// Функция для уведомления всех пользователей
async function notifyAllUsers(ctx) {

    // Добавлен ctx в качестве аргумента для доступа к сессии и другим методам контекста

    // Получаем все комментарии
    const allComments = await fetchComments()

    // Получаем данные всех пользователей
    const data = await fetchData(`${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`)

    // Извлекаем идентификаторы чатов из всех комментариев и удаляем дубликаты
    const user_ids = [...new Set(data.comments.map(comment => comment.user_id))]

    // Проходим по каждому идентификатору чата
    for (const chatId of user_ids) {

        // Фильтруем комментарии для данного пользователя
        const userComments = allComments.filter(comment => comment.user_id === chatId)

        // Если у пользователя нет комментариев, пропустить итерацию
        if (userComments.length === 0) continue

        // Формируем сообщение для пользователя
        const { id_task, kolvo_brak, det_name, date, specs_nom_id, type } = userActualComments[0]

        const typeMapping = {
            'ПО': 'Пооперационный контроль окончательный',
            'ПН': 'Пооперационный контроль неокончательный',
            'УО': 'Контроль перед упаковкой окончательный',
            'УН': 'Контроль перед упаковкой неокончательный',
        }
        const typeString = typeMapping[type] || 'Неизвестный тип'
        // Проверяем, отправлялось ли сообщение этому пользователю ранее по этой задаче
        if (sentTaskIds.includes(id_task)) {
            console.log(`Сообщение для id_task ${id_task} уже отправлено на chatId: ${chatId}`)
            continue
        }

        // Формируем текст сообщения
        const message = `<b>Пожалуйста, прокомментируйте следующую операцию:</b>`
            + `<code>(1/${userComments.length})</code>\n\n`
            + `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n`
            + `<b>Брак:</b> <code>${kolvo_brak}</code>\n`
            + `<b>Контроль:</b> <code>${typeString}</code>\n`
            + `<b>Партия:</b> <code>${specs_nom_id}</code>\n`
            + `<b>Дата:</b> <code>${date}</code>\n\n`
            + `<code>Cron</code> task_ID: <code>${id_task}</code>\n`
            + `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`

        // Пытаемся отправить сообщение
        try {
            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
            console.log(`Cron Сообщение отправлено на chatId: ${chatId}`)

            await sleep(2000) // Задержка на 5 секунд
        } catch (error) { // Если возникает ошибка при отправке
            console.error(`Failed to send message to chatId: ${chatId}`, error)
            // Отправляем уведомление в канал логирования
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение на chatId: ${chatId}\nError: ${error}`, { parse_mode: 'HTML' })
        }
        sentTaskIds.push(id_task)
    }
}

// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
