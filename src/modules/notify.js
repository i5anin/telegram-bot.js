const { resetFlags, formatPaymentDate } = require('#src/utils/helpers');
const { fetchComments } = require('#src/modules/comment');
const { sendToLog } = require('#src/utils/log');
const { updateComment, getAllUsers } = require('#src/api/index');

const typeMapping = {
    'ПО': 'Пооперационный контроль окончательный',
    'ПН': 'Пооперационный контроль неокончательный',
    'УО': 'Контроль перед упаковкой окончательный',
    'УН': 'Контроль перед упаковкой неокончательный',
};

let usersData = [];

async function loadUsersData() {
    try {
        usersData = await getAllUsers() || [];
    } catch (error) {
        console.error('Failed to fetch users data:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(chatId, message) {
    await sleep(500);
    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
        return true;
    } catch (error) {
        console.error(`Notify. Failed to send message to chatId: ${chatId}`, error);
        if (error.code === 400 && error.description === 'Bad Request: chat not found') {
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Чат не найден: <code>${chatId}</code>`, { parse_mode: 'HTML' });
        }
        return false;
    }
}

async function updateTaskStatus(id_task) {
    try {
        const response = await updateComment(id_task);
        console.log(`Notify. ${response && response.status === 'OK' ? 'Task status updated successfully' : 'Failed to update task status:' + response.status}`);
    } catch (error) {
        console.log('Notify. Error while updating task status:', error);
    }
}

function formatMessage(comment, total) {
    const { id_task, kolvo_brak, det_name, type, comments_otk, specs_nom_id } = comment;
    const typeString = typeMapping[type] || 'Неизвестный тип';
    const { formattedDate } = formatPaymentDate({ date: comment.date });

    return `<b>Пожалуйста, прокомментируйте следующую операцию:</b><code>(1/${total})</code>\n\n` +
        `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `<b>Брак:</b> <code>${kolvo_brak}</code>\n` +
        `<b>Контроль:</b> <code>${typeString}</code>\n` +
        `<b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
        `<b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `<b>Дата:</b> <code>${formattedDate}</code>\n\n` +
        `task_ID: <code>${id_task}</code>\n\n` +
        `<i>необходимо прокомментировать через "ответить" на это сообщение</i>`;
}

function getUserName(userId) {
    const user = usersData.find(u => u.user_id === userId);
    return user ? user.fio : '<code>Неизвестный пользователь</code>';
}

async function processUserComments(userComments) {
    const chatId = userComments[0].user_id;
    const message = formatMessage(userComments[0], userComments.length);
    const isMessageSent = await sendMessage(chatId, message);

    if (isMessageSent) {
        const masterChatId = userComments[0].user_id_master;
        if (masterChatId) {
            const masterMessage = formatMasterMessage(userComments[0], chatId);
            await sendMessage(masterChatId, masterMessage);
        }
        await updateTaskStatus(userComments[0].id_task);
    }
}

function formatMasterMessage(comment, chatId) {
    const { det_name, kolvo_brak, type, comments_otk, specs_nom_id } = comment;
    const typeString = typeMapping[type] || 'Неизвестный тип';
    const { formattedDate } = formatPaymentDate({ date: comment.date });

    return `<b>Уведомление отправлено</b> <code>${getUserName(chatId)}</code>\n\n` +
        `<b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `<b>Брак:</b> <code>${kolvo_brak}</code>\n` +
        `<b>Контроль:</b> <code>${typeString}</code>\n` +
        `<b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
        `<b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `<b>Дата:</b> <code>${formattedDate}</code>\n`;
}

async function notifyAllUsers() {
    await loadUsersData();
    const allComments = await fetchComments();
    const user_ids = [...new Set(allComments.map(comment => comment.user_id))];

    for (const chatId of user_ids) {
        const userComments = allComments.filter(comment => comment.user_id === chatId && comment.sent === 0);
        if (userComments.length > 0) {
            await processUserComments(userComments);
        }
    }
}

async function notifyUsers(ctx) {
    await sendToLog(ctx);
    if (ctx.chat.type !== 'private') return;

    resetFlags(ctx);
    const chatId = ctx.message.chat.id;

    await loadUsersData();
    const uncommentedTasks = await fetchComments(chatId);

    if (uncommentedTasks.some(task => task.user_id === chatId)) {
        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId);
        if (userActualComments.length > 0) {
            await processUserComments(userActualComments);
        }
    }
}

module.exports = { notifyUsers, notifyAllUsers, typeMapping };
