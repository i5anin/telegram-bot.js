// Отслеживаем событие добавления нового пользователя в чат
const { checkUser } = require('#src/api/index')

async function logNewChatMembers(ctx) {
    const chatTitle = ctx.chat.title || 'Неназванный чат'
    const addedUsers = ctx.message.new_chat_members

    for (const user of addedUsers) {
        const username = user.username || 'N/A'
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        const userId = user.id

        const message = `${emoji.ok} Добавили в группу <code>${chatTitle}</code>\nИмя: <code>${fullName}</code>\nID: <code>${userId}</code>\nUsername: <code>${username}</code>`
        await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' })
    }
}

// Отслеживаем событие удаления пользователя из чата
async function logLeftChatMember(ctx) {
    const chatTitle = ctx.chat.title || 'Неназванный чат'
    const leftMember = ctx.message.left_chat_member

    // Информация о пользователе
    const username = leftMember.username || 'N/A'
    const fullName = `${leftMember.first_name || ''} ${leftMember.last_name || ''}`.trim()
    const userId = leftMember.id

    const message = `${emoji.x} Пользователь покинул группу <code>${chatTitle}</code>\nИмя: <code>${fullName}</code>\nID: <code>${userId}</code>\nUsername: <code>${username}</code>`

    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' })
}

// // Отслеживаем новые сообщения на канале
// bot.on('channel_post', async (ctx) => {
//     const channelTitle = ctx.chat.title || 'Неназванный канал';
//     const messageId = ctx.message.message_id;
//     const text = ctx.message.text || 'N/A';
//     const date = new Date(ctx.message.date * 1000); // Дата сообщения
//
//     const message = `📢 Новое сообщение на канале <code>${channelTitle}</code>\nMessage ID: <code>${messageId}</code>\nТекст: <code>${text}</code>\nДата: <code>${date.toISOString()}</code>`;
//     await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' });
// });
//
// // Отслеживаем редактированные сообщения на канале
// bot.on('edited_channel_post', async (ctx) => {
//     const channelTitle = ctx.chat.title || 'Неназванный канал';
//     const messageId = ctx.message.message_id;
//     const editedText = ctx.message.text || 'N/A';
//     const editDate = new Date(ctx.message.edit_date * 1000); // Дата редактирования
//
//     const message = `📝 Редактированное сообщение на канале <code>${channelTitle}</code>\nMessage ID: <code>${messageId}</code>\nОтредактированный текст: <code>${editedText}</code>\nДата редактирования: <code>${editDate.toISOString()}</code>`;
//     await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' });
// });


// Функция лог в спец чат


async function sendToLog(ctx) {
    const { chat, from, text } = ctx.message;
    const userData = await checkUser(chat.id);
    const fio = userData?.fio || 'N/A';  // Предполагая, что ФИО хранится в свойстве 'fio'
    const username = from.username ? '@' + from.username : '<code>N/A</code>';
    await bot.telegram.sendMessage(
        LOG_CHANNEL_ID,
        `ID:\u00A0<code>${chat.id}</code> ` +
        `fio:\u00A0<code>${fio}</code>\n` +  // Добавлено ФИО
        `username: ${username} ` +
        `name: <code>${from.first_name || 'N/A'}\u00A0${from.last_name || 'N/A'}</code>\n` +
        `msg: <code>${text}</code>`,
        { parse_mode: 'HTML' },
    );
}



module.exports = {
    logNewChatMembers,
    logLeftChatMember,
    sendToLog,
}