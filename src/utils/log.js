// Отслеживаем событие добавления нового пользователя в чат
const { checkUser } = require('#src/api/index')
const { logMessage } = require('#src/utils/ru_lang')
const { getAllUsers } = require('#src/api/index')

async function logNewChatMembers(ctx) {
  const chatTitle = ctx.chat.title || 'Неназванный чат'
  const addedUsers = ctx.message.new_chat_members

  for (const newUser of addedUsers) {
    const username = newUser.username || 'N/A'
    const fullName =
      `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim()
    const userId = newUser.id

    const usersData = await getAllUsers()
    const user = usersData.find((u) => u.user_id === userId)

    // Создайте сообщение, независимо от наличия пользователя в базе данных
    const message =
      `${emoji.ok} Добавили в группу <code>${chatTitle}</code>\n\n` +
      logMessage(userId, user ? user.fio : 'N/A', username, fullName)

    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, {
      parse_mode: 'HTML'
    })
  }
}

// Отслеживаем событие удаления пользователя из чата
async function logLeftChatMember(ctx) {
  const chatTitle = ctx.chat.title || 'Неназванный чат'
  const leftUser = ctx.message.left_chat_member

  if (leftUser) {
    const username = leftUser.username || 'N/A'
    const fullName =
      `${leftUser.first_name || ''} ${leftUser.last_name || ''}`.trim()
    const userId = leftUser.id

    const usersData = await getAllUsers()
    const user = usersData.find((u) => u.user_id === userId)

    const message =
      `${emoji.x} Покинул группу <code>${chatTitle}</code>\n\n` +
      logMessage(userId, user ? user.fio : 'N/A', username, fullName)

    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, {
      parse_mode: 'HTML'
    })
  } else {
    // Обработка случая, когда объект leftUser не существует (например, пользователь покинул чат до обработки события)
    console.log('Объект leftUser не существует.')
  }
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
  if (chat.id !== GRAND_ADMIN) {
    const userData = await checkUser(chat.id)
    const fio = userData?.fio || 'N/A' // Предполагая, что ФИО хранится в свойстве 'fio'
    const fullName =
      (from.first_name ? from.first_name + ' ' : '') +
      (from.last_name ? from.last_name : '')
    const username = from.username || ''
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `<blockquote>${text}</blockquote>\n` +
        logMessage(chat.id, fio, username, fullName),
      { parse_mode: 'HTML' }
    )
  }
}

module.exports = {
  logNewChatMembers,
  logLeftChatMember,
  sendToLog
}
