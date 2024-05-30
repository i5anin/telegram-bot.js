// Подключаем необходимые модули и переменные
import { sendToLog } from '#src/utils/log' // Добавление лога
import { resetFlags } from '#src/utils/helpers'
import { checkUser } from '#src/api/index'
// const { handleTextCommand } = require('#src/modules/text')  // Обработка текстовых сообщений

// Функция для проверки, зарегистрирован ли пользователь на сервере
async function checkRegistration(chatId) {
  try {
    const response = await checkUser(chatId) // Добавьте `await` здесь
    return {
      exists: response.exists === true,
      fio: response.fio
    }
  } catch (error) {
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `reg <code>${error}</code>`,
      { parse_mode: 'HTML' }
    )
    return { exists: false, fio: null }
  }
}

// Асинхронная функция для обработки команды регистрации
async function handleRegComment(ctx) {
  await sendToLog(ctx)
  if (ctx.chat.type !== 'private') return
  resetFlags(ctx)
  const chatId = ctx.message.chat.id

  try {
    const registrationData = await checkRegistration(chatId)
    const isRegistered = registrationData.exists
    const fio = registrationData.fio

    let textToReply
    if (isRegistered && fio) {
      textToReply = `<code>${fio}</code> <b>Вы уже зарегистрированы!</b>`
    } else {
      textToReply = ruLang.notRegistered
    }
    ctx.session.isAwaitFio = !isRegistered

    // Отправляем сообщение
    ctx.reply(textToReply, { parse_mode: 'HTML' })
  } catch (error) {
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `reg <code>${error}</code>`,
      { parse_mode: 'HTML' }
    )
    ctx.reply(
      'Произошла ошибка при проверке регистрации. Пожалуйста, попробуйте позже.'
    )
  }
}

export { handleRegComment, checkRegistration }
