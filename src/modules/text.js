const ruLang = require('#src/utils/ru_lang')
const fetchData = require('#src/utils/helpers')
const { notifyUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/admin') // Добавление лога

async function handleTextCommand(ctx) {
    await sendToLog(ctx) // функция sendToLog

    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    console.log(ctx.message.reply_to_message)

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment && !ctx.message.reply_to_message) return

    // --------- Обработка ожидания ФИО ---------
    if (ctx.session.isAwaitFio) {
        console.log('ctx.session.isAwaitFio=', ctx.session.isAwaitFio)
        if (!/^[А-Яа-яёЁëË]+\s[А-Яа-яёЁëË]\. ?[А-Яа-яёЁëË]\.$/.test(text)) { //налог с диакритическим знаком "ë"
            ctx.reply(ruLang.invalidData)
            return
        }
        // Дальнейшая логика обработки ФИО
        const cleanedText = text.replace(/ë/g, 'ё').replace(/Ë/g, 'Ё').replace(/\. /g, '.')
        // const encodedFio = encodeURIComponent(cleanedText)
        const userId = chat.id

        // Запрос на добавление пользователя
        const dataAddUser = await fetchData(
            `${WEB_API}/users/add.php`,
            {
                id: userId,
                fio: cleanedText,
                username: from.username,
                active: 1,
            },
        )
        ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })
        const defMsg = `\nID: <code>${userId}</code>` +
            `\nfio: <code>${cleanedText}</code>`

        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            dataAddUser ? `⭐ Пользователь добавлен.${defMsg}` :
                `⚠️Ошибка регистрации${defMsg}`,
            { parse_mode: 'HTML' },
        )

        await notifyUsers(ctx)
        ctx.session.isAwaitFio = false
    }

    // --------- Обработка ожидания комментария ---------
    if (ctx.message.reply_to_message) {
        await handleAddComment(ctx)
        console.log('Обработка ожидания комментария handleAddComment')
    }
}

module.exports = { handleTextCommand }

