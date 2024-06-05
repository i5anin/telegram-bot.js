const fs = require('fs')
const { getAllUsers } = require('#src/api/index')
const { sendLogData } = require('#src/api/index')

const getExternalUsers = async () => {
  try {
    const response = await getAllUsers()
    stateCounter.users_get_all_fio++
    if (response && response.users_data) {
      return response.users_data
    } else {
      throw new Error('Invalid response from getAllUsers')
    }
  } catch (error) {
    const logMessageToSend = {
      user_id: '',
      text: error.toString(),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    console.error('Ошибка при получении данных с внешнего API:', error)
    return []
  }
}

async function generateReport(ctx, chatId) {
  // Локальные переменные для CSV отчета
  const csvReport = ['username;id;firstname;lastname;fio;status']

  // Получаем информацию о чате и внешних пользователях
  const chatInfo = await ctx.telegram.getChat(chatId)
  const chatMembersCount = await ctx.telegram.getChatMembersCount(chatId)
  const externalUsers = await getExternalUsers()

  // Отправляем сообщение в лог-канал
  await bot.telegram.sendMessage(
    LOG_CHANNEL_ID,
    `Отчет для группы <code>${chatInfo.title}</code>\nID: <code>${chatId}</code>\nКоличество пользователей: <code>${chatMembersCount}</code>`,
    { parse_mode: 'HTML' }
  )

  // let absentCounter = 0

  // Обходим всех внешних пользователей
  for (const user of externalUsers) {
    try {
      // Пытаемся получить информацию о пользователе в телеграме
      const telegramUser = await ctx.telegram.getChatMember(
        chatId,
        user.user_id
      )
      const status = telegramUser.status // Здесь хранится статус пользователя

      // Добавляем информацию в CSV отчет
      const userInfoCsv = `${telegramUser.user.username || 'N/A'};${telegramUser.user.id};${telegramUser.user.first_name};${telegramUser.user.last_name || 'N/A'};${user.fio};${status}`
      csvReport.push(userInfoCsv)
    } catch (error) {
      const logMessageToSend = {
        user_id: '',
        text: error.toString(),
        error: 1,
        ok: 0,
        test: process.env.NODE_ENV === 'build' ? 0 : 1
      }
      await sendLogData(logMessageToSend)
      // Пользователь отсутствует в чате
      // absentCounter++

      // Добавляем информацию об отсутствующих пользователях в CSV отчет
      const userInfoCsv = `N/A;${user.user_id};N/A;N/A;${user.fio};left` // Статус 'left'
      csvReport.push(userInfoCsv)
    }
  }
  // Сохраняем CSV отчеты
  fs.writeFileSync(`${chatInfo.title}_report.csv`, csvReport.join('\n'))
}

async function handleGetGroupInfoCommand(ctx) {
  if (ctx.from.id.toString() !== GRAND_ADMIN) {
    return ctx.reply('Только GRAND_ADMIN может использовать данную команду.')
  }

  const input = ctx.message.text.split(' ')

  if (input.length !== 2) {
    return ctx.reply('Использование: /get_group_info [chat_id]')
  }

  const chatId = input[1]
  await generateReport(ctx, chatId)
}

module.exports = { handleGetGroupInfoCommand }
