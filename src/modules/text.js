// Обработка текстовых команд ФИО /add_user
const ruLang = require('./ru_lang')
const fetchData = require('./helpers')
const notifyUsers = require('./notify')
const handleAddComment = require('./comment')

module.exports = async function handleTextCommand(ctx, state, bot) {

    const USER_API = 'https://bot.pf-forum.ru/api/users'
    const COMMENT_API = 'https://bot.pf-forum.ru/api/comment'
    const GRAND_ADMIN = process.env.GRAND_ADMIN
    const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '-1001946496691'

    const { text, chat, from } = ctx.message
    if (chat.id !== parseInt(GRAND_ADMIN)) await sendToLog(ctx) // chat.id=number GRAND_ADMIN=string
    if (state.isAwaitFio) {
        if (/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\. ?[А-Яа-яёЁ]\.$/.test(text)) {
            const cleanedText = text.replace(/\. /g, '.') // Удаляем пробелы после точек
            const encodedFio = encodeURIComponent(cleanedText) // Процентное кодирование для URL
            const userId = chat.id

            // Запрос на добавление пользователя
            const dataAddUser = await fetchData(
                USER_API + '/add.php',
                {
                    id: userId,
                    fio: cleanedText,
                    username: from.username,
                    active: 1,
                },
            )

            ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })

            // Запрос на добавление пользователя
            const dataRankUp = await fetchData(
                USER_API + '/rank_up.php',
                { id_user: userId, fio: encodedFio },
            )
            const dataRankUp2 = await fetchData(
                USER_API + '/rank_up2.php',
                { id_user: userId, fio: encodedFio },
            )

            const defMsg = `\nID: <code>${userId}</code>` +
                `\nfio: <code>${cleanedText}</code>`

            // Логирование в LOG_CHANNEL_ID для rank_up для add_user
            if (dataAddUser) {
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `⭐ Пользователь добавлен.` +
                    `\nДобавлена кастомная метка:` + defMsg,
                    { parse_mode: 'HTML' },
                )
                state.myCounter++ //счётчик регистраций pm2
            } else {
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `⚠️Ошибка регистрации` + defMsg,
                    { parse_mode: 'HTML' },
                )
            }
            await notifyUsers(ctx, bot, state) // если зарегистрировался кидем задачу
            state.isAwaitFio = false // Сбрасываем флаг
        } else {
            ctx.reply(ruLang.invalidData)
        }
    } else if (state.isAwaitComment) {
        // Добавленная часть
        // Вызываем уже существующую функцию обработки комментария
        await handleAddComment(ctx)
    }
}