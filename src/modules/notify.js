// Импортируем необходимые функции
const fetchData = require('#src/utils/helpers')
const { fetchComments } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/admin')

// Функция для уведомления одного пользователя о некомментированных задачах
async function notifyUsers(ctx) {
    const chatId = ctx.message.chat.id // Получаем ID чата из контекста сообщения
    await sendToLog(ctx)
    try {
        // Получаем список некомментированных задач для данного пользователя
        const uncommentedTasks = await fetchComments(chatId)

        // Проверяем, есть ли какие-либо некомментированные задачи
        if (!uncommentedTasks || uncommentedTasks.length === 0) {
            const errorMessage = 'Пустые комментарии не найдены.';
            //const errorMessage = uncommentedTasks ? 'Пустые комментарии не найдены.' : 'Произошла ошибка при получении комментариев.'
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
        ctx.session.id_task = id_task
        console.log('ctx.session.id_task = ', ctx.session.id_task)
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })

        // Увеличиваем счетчик сообщений
        stateCounter.message++

    } catch (error) {
        // Логируем ошибку, если что-то пошло не так
        console.log('Error in notifyUsers:', error)
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `\n<code>${error}</code>`,
            { parse_mode: 'HTML' }
        );
    }
    ctx.session.isAwaitComment = true
}

// Вспомогательная функция для создания задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Функция для уведомления всех пользователей
async function notifyAllUsers(ctx) { // Добавлен ctx в качестве аргумента для доступа к сессии и другим методам контекста

    // Получаем все комментарии
    const allComments = await fetchComments();

    // Получаем данные всех пользователей
    const data = await fetchData(`${COMMENT_API}/get_all.php?key=${SECRET_KEY}`);

    // Извлекаем идентификаторы чатов из всех комментариев и удаляем дубликаты
    const user_ids = [...new Set(data.comments.map(comment => comment.user_id))];

    // Проходим по каждому идентификатору чата
    for (const chatId of user_ids) {

        // Фильтруем комментарии для данного пользователя
        const userComments = allComments.filter(comment => comment.user_id === chatId);

        // Если у пользователя нет комментариев, пропустить итерацию
        if (userComments.length === 0) continue;

        // Извлекаем данные из первого комментария
        const { id_task, kolvo_brak, det_name, date } = userComments[0];

        // Проверяем, отправлялось ли сообщение этому пользователю ранее по этой задаче
        if (ctx.session.sentMessages && ctx.session.sentMessages.includes(id_task)) {
            console.log(`Message for id_task ${id_task} already sent to chatId: ${chatId}`);
            continue; // Пропустить, если сообщение уже отправлялось
        }

        // Формируем текст сообщения
        const message = `Вам нужно прокомментировать следующую задачу:`
            + `<code>(1/${userComments.length})</code>\n\n`
            + `Название и обозначение:\n`
            + `<code>${det_name}</code>\n`
            + `Брак: <code>${kolvo_brak}</code>\n`
            + `Дата: <code>${date}</code>\n`
            + `ID: <code>${id_task}</code>\n`
            + `<code>Cron</code>`;

        // Пытаемся отправить сообщение
        try {
            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log(`Message sent to chatId: ${chatId}`);

            // Запоминаем, что сообщение отправлено этому пользователю по данной задаче
            if (!ctx.session.sentMessages) {
                ctx.session.sentMessages = [];
            }
            ctx.session.sentMessages.push(id_task);

            // Сбрасываем флаги сессии и устанавливаем ожидание комментария только для тех, кому было отправлено сообщение
            // ctx.session[chatId] = { isAwaitingComment: true };

            await sleep(5000); // Задержка на 5 секунд
        } catch (error) { // Если возникает ошибка при отправке
            console.error(`Failed to send message to chatId: ${chatId}`, error);
            try {
                // Отправляем уведомление в канал логирования
                await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение на chatId: ${chatId}\nError: ${error}`, { parse_mode: 'HTML' });
            } catch (logError) {
                console.error(`Failed to send log message: ${logError}`);
            }
        }
    }
}


// Функция для сброса флагов сессии
// function resetFlags(ctx) {
//     ctx.session.isAwaitFio = false;
//     ctx.session.isAwaitComment = false;
//     ctx.session.userInitiated = false;
// }





// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
