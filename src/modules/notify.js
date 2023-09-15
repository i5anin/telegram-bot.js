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

// Функция для уведомления всех пользователей
// Вспомогательная функция для создания задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Функция для уведомления всех пользователей
async function notifyAllUsers(ctx) { // Добавлен ctx в качестве аргумента
    const allComments = await fetchComments();
    const data = await fetchData(`${COMMENT_API}/get_all.php?key=${SECRET_KEY}`);
    const user_ids = [...new Set(data.comments.map(comment => comment.user_id))];

    for (const chatId of user_ids) {
        // console.log(`Processing chatId: ${chatId}`);

        const userComments = allComments.filter(comment => comment.user_id === chatId);
        if (userComments.length === 0) continue;

        const { id_task, kolvo_brak, det_name, date } = userComments[0];

        // Проверяем, отправлялось ли сообщение ранее
        if (ctx.session.sentMessages && ctx.session.sentMessages.includes(id_task)) {
            console.log(`Message for id_task ${id_task} already sent to chatId: ${chatId}`);
            continue; // Пропустить, если сообщение уже отправлялось
        }

        const message = `Вам нужно прокомментировать следующую задачу:`
            + `<code>(1/${userComments.length})</code>\n\n`
            + `Название и обозначение:\n`
            + `<code>${det_name}</code>\n`
            + `Брак: <code>${kolvo_brak}</code>\n`
            + `Дата: <code>${date}</code>\n`
            + `ID: <code>${id_task}</code>\n`
            + `<code>Cron</code>`;

        try {
            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log(`Message sent to chatId: ${chatId}`);

            // Запоминаем, что сообщение отправлено
            if (!ctx.session.sentMessages) {
                ctx.session.sentMessages = [];
            }
            ctx.session.sentMessages.push(id_task);

            await sleep(5000); // Задержка на 5 секунд
        } catch (error) {
            console.error(`Failed to send message to chatId: ${chatId}`, error);
            try {
                await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение на chatId: ${chatId}\nError: ${error}`, { parse_mode: 'HTML' });
            } catch (logError) {
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `\n<code>${error}</code>`,
                    { parse_mode: 'HTML' }
                );
                console.error(`Failed to send log message: ${logError}`);
            }
        }
    }
}



// Экспортируем функции
module.exports = { notifyUsers, notifyAllUsers }
