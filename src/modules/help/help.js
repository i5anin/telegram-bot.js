const fs = require('fs')
const { sendToLog } = require('#src/modules/log/log')
const { getAllUsers } = require('#src/api/api')
const { sendLogData } = require('#src/api/api')

async function getUserInfo(userId) {
  try {
    // Запрашиваем данные всех пользователей
    const response = await getAllUsers()
    // Ищем пользователя с заданным userId в полученных данных
    const user = response.find((u) => u.user_id === userId) // Изменили response.users_data на response
    if (user) {
      // Если пользователь найден, возвращаем его данные
      return { userId: user.user_id, fio: user.fio }
    } else {
      // Если пользователь не найден, выбрасываем ошибку или возвращаем undefined/null
      throw new Error('User not found')
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
    console.error('Ошибка при получении данных пользователя:', error)
    throw error
  }
}

async function handleHelpCommand(ctx) {
  await sendToLog(ctx)

  // Получаем аргументы после команды
  const input = ctx.message.text.split(' ')
  const userId = input[1] ? parseInt(input[1]) : ctx.from.id // Если аргумент после команды не задан, используем ID отправителя

  // Проверяем, является ли отправитель администратором
  if (String(ctx.from.id) === GRAND_ADMIN) {
    try {
      await sendHelpToUser(ctx, userId)

      // Получаем информацию о пользователе с помощью функции getUserInfo
      const user = await getUserInfo(userId)

      // Отправляем сообщение администратору в личные сообщения с информацией о пользователе
      await ctx.telegram.sendMessage(
        LOG_CHANNEL_ID,
        `Сообщение /help отправлено пользователю\nID: <code>${user.userId}</code>\nФИО: <code>${user.fio}</code>`,
        { parse_mode: 'HTML' }
      )
    } catch (err) {
      // Проверяем, является ли ошибка ошибкой Telegram
      if (
        err.response &&
        err.response.data &&
        err.response.data.error_code === 400 &&
        err.response.data.description.includes('chat not found')
      ) {
        await ctx.telegram.sendMessage(
          ctx.from.id,
          'Не удалось отправить сообщение пользователю. Чат не найден.'
        )
      } else {
        // Если это другой тип ошибки, выводим ее в консоль и отправляем сообщение о неизвестной ошибке в личные сообщения
        console.error('Error sending help to user:', err)
        await ctx.telegram.sendMessage(
          ctx.from.id,
          `Произошла неизвестная ошибка.\n<code>${JSON.stringify(err)}</code>`,
          {
            parse_mode: 'HTML'
          }
        )
      }
    }
  } else {
    // Если отправитель не является администратором или аргумент не предоставлен, отправляем справку отправителю
    await sendHelpToUser(ctx, ctx.from.id)
  }
}

async function sendHelpToUser(ctx, chatId) {
  // Формируем и отправляем справку пользователю с указанным chatId
  const photo = fs.createReadStream('src/modules/help/media/answer.jpg')
  const video = fs.createReadStream('src/modules/help/media/answer.mp4') // Убедитесь, что путь к файлу верный
  const messageJpg = `Доступные команды:

1. /new_comment - Получить новые комментарии
${emoji.point} прокомментировать задачу, нажав <u>ответить</u>
${emoji.point} телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
${emoji.point} пк: правой кнопкой мыши <u>ответить</u>

2. /docs - Посмотреть полезные документы

Для регистрации подойдите в отдел <b>IT</b>

В случае ошибки напишите разработчику @i5anin Сергей.`

  await ctx.telegram.sendPhoto(
    chatId,
    { source: photo },
    {
      caption: messageJpg,
      parse_mode: 'HTML'
    }
  )

  // Отправка видео
  await ctx.telegram.sendVideo(chatId, { source: video })
}

module.exports = { handleHelpCommand }
