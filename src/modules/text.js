const ruLang = require('#src/utils/ru_lang')
const fetchData = require('#src/utils/helpers')
const { notifyUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log') // Добавление лога

async function handleTextCommand(ctx) {
    await sendToLog(ctx) // функция sendToLog
    // Константы
    const USER_API = 'https://bot.pf-forum.ru/api/users'

    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment) return

    // Обработка ожидания ФИО
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
            `${USER_API}/add.php`,
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

    console.log('ctx.session.isAwaitComment = ', ctx.session.isAwaitComment)
    // Обработка ожидания комментария
    if (ctx.session.isAwaitComment) {
        await handleAddComment(ctx)
        console.log('Обработка ожидания комментария')
    }
}

module.exports = { handleTextCommand }

