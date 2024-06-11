const { logMessage } = require('#src/utils/ru_lang')
const { getAllUsers } = require('#src/api/index')
const { sendLogData, checkUser } = require('#src/api/index')

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

    const message =
      `${emoji.ok} Добавили в группу <code>${chatTitle}</code>\n\n` +
      logMessage(userId, user ? user.fio : 'N/A', username, fullName)

    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, {
      parse_mode: 'HTML'
    })
  }
}

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
    console.log('Объект leftUser не существует.')
  }
}

async function sendToLog(ctx) {
  const { chat, from, text } = ctx.message

  const groupId = chat.id // Получаем ID группы
  const userId = from.id // Получаем ID пользователя

  const userData = await checkUser(userId) // Вызов функции checkUser
  const groupName = chat.title || 'N/A' // Название группы
  const fio = userData.fio || 'N/A' // Извлечение fio
  const fullName = `${from.first_name ?? ''} ${from.last_name ?? ''}`.trim()
  const username = from.username || ''

  // console.log(fio)

  // Формируем объект лога
  const logMessageToSend = {
    user_id: userId,
    group_id: groupId,
    text: text,
    error: 0,
    ok: 1,
    type: chat.type,
    fio: fio,
    group_name: groupName,
    test: process.env.NODE_ENV === 'build' ? 0 : 1
  }
  // console.log(logMessageToSend)
  await sendLogData(logMessageToSend)
}
module.exports = {
  logNewChatMembers,
  logLeftChatMember,
  sendToLog
}
