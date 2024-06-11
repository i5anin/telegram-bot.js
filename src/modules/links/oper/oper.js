const axios = require('axios')
const { Markup } = require('telegraf')
const { sendToLog } = require('#src/utils/log')
const { sendLogData } = require('#src/api/api')
const { checkRegistration } = require('#src/modules/reg/reg')

const apiUrl = `${process.env.WEB_API}/links/links.php` // Замените на ваш API URL

async function handleOperatorCommand(ctx) {
  await sendToLog(ctx)
  const chatId = ctx.message.chat.id // Получение chatId из контекста ctx
  try {
    const registrationData = await checkRegistration(chatId) // Проверка регистрации
    const isRegistered = registrationData.exists

    if (isRegistered) {
      // Если пользователь зарегистрирован
      const links = await getLinks('oper') // Получаем ссылки из API

      if (links.length > 0) {
        const keyboard = Markup.inlineKeyboard(
          links.map((link) => [Markup.button.url(link.tiitle, link.links)])
        )

        await ctx.reply('Вот несколько полезных ссылок:', keyboard)
      } else {
        await ctx.reply('В данный момент нет доступных ссылок.')
      }
    } else {
      // Если пользователь не зарегистрирован
      await ctx.reply(
        'Доступ закрыт.\nВы должны зарегистрироваться, чтобы получить доступ к этим ресурсам.'
      )
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
    console.error('Ошибка при проверке регистрации:', error)
    await ctx.reply(
      'Произошла ошибка при проверке регистрации. Пожалуйста, попробуйте позже.'
    )
  }
}

async function getLinks(type) {
  try {
    const response = await axios.get(`${apiUrl}?type=${type}`)
    return response.data.links
  } catch (error) {
    console.error('Ошибка при получении ссылок:', error)
    return []
  }
}

module.exports = {
  handleOperatorCommand
}
