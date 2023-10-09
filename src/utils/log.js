// Отслеживаем событие добавления нового пользователя в чат
const { checkUser } = require('#src/api/index')
const { logMessage } = require('#src/utils/ru_lang')
const { getAllUsers } = require('#src/api')

async function logNewChatMembers(ctx) {
    const chatTitle = ctx.chat.title || 'Неназванный чат'
    const addedUsers = ctx.message.new_chat_members

    for (const user of addedUsers) {
        const username = user.username || 'N/A'
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        const userId = user.id

        const usersData = await getAllUsers();
        const user = usersData.find(u => u.user_id === userId);

        if (user) {
            // Если пользователь существует, создайте сообщение
            const message = `${emoji.ok} Добавили в группу <code>${chatTitle}</code>\n\n` + logMessage(userId, user.fio, username, fullName);

            await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' });
        } else {
            // Если пользователь не найден, можно выполнить какие-либо другие действия или отправить соответствующее сообщение.
            console.log(`Пользователь с ID ${userId} не найден.`);
        }
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
    const { chat, from, text } = ctx.message
    const userData = await checkUser(chat.id)
    const fio = userData?.fio || 'N/A'  // Предполагая, что ФИО хранится в свойстве 'fio'
    const fullName = (from.first_name ? from.first_name + ' ' : '') + (from.last_name ? from.last_name : '')
    const username = from.username || ''
    await bot.telegram.sendMessage(
        LOG_CHANNEL_ID,
        `<b>msg:</b> <code>${text}</code>\n\n` + logMessage(chat.id, fio, username, fullName),
        { parse_mode: 'HTML' },
    )
}


module.exports = {
    logNewChatMembers,
    logLeftChatMember,
    sendToLog,
}