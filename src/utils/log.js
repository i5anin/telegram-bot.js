// Отслеживаем событие добавления нового пользователя в чат
const { checkUser } = require('#src/api/index')
const { logMessage } = require('#src/utils/ru_lang')
const { getAllUsers } = require('#src/api/index')
const { post } = require('axios')

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

/**
 * Функция для отправки лога на внешний ресурс.
 * @param {Object} logData Данные для логирования.
 *
 * Объект logData должен содержать следующие поля:
 * - user_id: {Number|String} Уникальный идентификатор пользователя, событие которого логируется.
 * - text: {String} Текстовое сообщение, которое необходимо залогировать.
 *   Может включать в себя исходное сообщение пользователя, его имя и другие данные,
 *   которые были получены или сгенерированы в ходе выполнения операций.
 * - error: {Number} Флаг, указывающий на наличие ошибки (0 - без ошибок, 1 - с ошибкой).
 * - ok: {Number} Флаг успешности операции (1 - операция успешна, 0 - операция не успешна).
 * - type: {String} Тип события, например, 'message' для сообщений от пользователя.
 * - info: {String} Дополнительная информация о логируемом событии, которую можно использовать для анализа.
 *
 * Эти поля позволяют структурированно записывать в лог информацию о различных событиях.
 */
async function sendLogData(logData) {
  try {
    await post(`${WEB_API}/log/log.php`, logData)
    console.log('Лог успешно отправлен на внешний ресурс.')
  } catch (error) {
    console.error('Ошибка при отправке лога на внешний ресурс:', error)
  }
}

// Функция для вызова отправки лога
async function sendToLog(ctx) {
  const { chat, from, text } = ctx.message
  if (chat.id !== GRAND_ADMIN) {
    // Предполагаем, что функция checkUser и logMessage уже описаны и доступны для использования
    const userData = await checkUser(chat.id)
    const fio = userData?.fio || 'N/A' // Предполагаем, что ФИО хранится в свойстве 'fio' у userData
    const fullName = `${from.first_name ?? ''} ${from.last_name ?? ''}`.trim()
    const username = from.username || ''

    const logMessageToSend = {
      user_id: chat.id,
      text: text,
      error: 0,
      ok: 1,
      type: 'message',
      info: fio
    }

    await sendLogData(logMessageToSend)
  }
}

module.exports = {
  logNewChatMembers,
  logLeftChatMember,
  sendToLog
}
