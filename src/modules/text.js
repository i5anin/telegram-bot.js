const ruLang = require('#src/utils/ru_lang')

const { handleAddComment } = require('#src/modules/comment')
const { notifyUsers } = require('#src/modules/notify')
const { sendToLog } = require('#src/utils/log')
const { addUser, addPhotoData } = require('#src/api/index')
const { logMessage } = require('#src/utils/ru_lang')
const { message } = require('telegraf/filters')

async function handleFio(ctx, text, chat, from) {
  console.log('ctx.session.isAwaitFio=', ctx.session.isAwaitFio)
  if (!/^[А-Яа-яёЁëË]+\s[А-Яа-яёЁëË]\. ?[А-Яа-яёЁëË]\.$/.test(text)) {
    ctx.reply(ruLang.invalidData)
    return
  }
  const cleanedText = text
    .replace(/ë/g, 'ё')
    .replace(/Ë/g, 'Ё')
    .replace(/\. /g, '.')
  const userId = chat.id

  try {
    const dataAddUser = await addUser(userId, cleanedText, from.username)
    console.log('dataAddUser=', dataAddUser)
    if (dataAddUser && dataAddUser.status === 'OK') {
      ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })
      const defMsg =
        `\nID: <code>${userId}</code>` + `\nfio: <code>${cleanedText}</code>`

      await bot.telegram.sendMessage(
        LOG_CHANNEL_ID,
        `${emoji.star}Пользователь добавлен.${defMsg}`,
        { parse_mode: 'HTML' }
      )
      // await notifyUsers(ctx)
    } else {
      throw new Error(
        dataAddUser
          ? dataAddUser.message
          : '\nНеизвестная ошибка при добавлении пользователя.'
      )
    }
  } catch (error) {
    console.error('Ошибка при добавлении пользователя:', error.message)
    ctx.reply(`Ошибка регистрации: ${error.message}`, {
      parse_mode: 'HTML'
    })
    const defMsg =
      `\nID: <code>${userId}</code>` + `\nfio: <code>${cleanedText}</code>`

    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `⚠️Ошибка регистрации${defMsg}`,
      { parse_mode: 'HTML' }
    )
  }
  ctx.session.isAwaitFio = false
}

async function photoParty(ctx, text) {
  console.log('photoParty function called with text:', text)
  if (isNaN(Number(text))) {
    ctx.reply(
      'Введенный номер партии не является числом. Пожалуйста, укажите корректный номер партии.'
    )
    return // выход из функции
  }
  ctx.session.batchNumber = text
  ctx.reply(
    `Вы ввели номер партии: <code>${ctx.session.batchNumber}</code>.\nПожалуйста, введите комментарий.`,
    { parse_mode: 'HTML' }
  )
  ctx.session.photoParty = false
  ctx.session.photoMessage = true
}

async function photoMessageComment(ctx) {
  console.log('photoMessageComment function called')
  const { text } = ctx.message
  ctx.session.photoComment = text
  ctx.reply(
    `Фото успешно добавлено!\nНомер партии: <code>${ctx.session.batchNumber}</code>\nВаш комментарий к фотографии: <code>${ctx.session.photoComment}</code>\n`,
    { parse_mode: 'HTML' }
  )

  try {
    const response = await addPhotoData(
      ctx.from.id,
      ctx.session.batchNumber,
      ctx.session.photoComment,
      ctx.session.filePath
    )

    if (response && response.status === 'OK') {
      // ctx.reply(`Фото успешно добавлено!`, { parse_mode: 'HTML' })
    } else {
      ctx.reply(`Ошибка при добавлении фото: ${response.message}`, {
        parse_mode: 'HTML'
      })
    }
  } catch (err) {
    console.error('Ошибка при добавлении данных о фото:', err)
    ctx.reply(
      'Произошла ошибка при добавлении фото. Пожалуйста, попробуйте позже.',
      { parse_mode: 'HTML' }
    )
  }
  ctx.session.step = ''
  ctx.session.photoMessage = false
}

async function handleTextCommand(ctx) {
  await sendToLog(ctx)
  if (ctx.chat.type !== 'private') return
  const { text, chat, from } = ctx.message
  if (ctx.session.isAwaitFio) return await handleFio(ctx, text, chat, from)
  if (ctx.message.reply_to_message) return await handleAddComment(ctx)
  if (ctx.session.photoParty) return await photoParty(ctx, text)
  if (ctx.session.photoMessage) return await photoMessageComment(ctx)
  if (
    !ctx.session.isAwaitFio &&
    !ctx.session.photoParty &&
    !ctx.session.photoMessage &&
    !ctx.message.reply_to_message
  ) {
    if (ctx.chat.type !== 'private') return
    await sendToLog(ctx)
    const message = `${emoji.x} Извините, я не понимаю это сообщение.\nПожалуйста, воспользуйтесь инструкцией /help.`
    await ctx.reply(message, { parse_mode: 'HTML' })
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `${message}\n<code>${chat.id}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

module.exports = { handleTextCommand }
