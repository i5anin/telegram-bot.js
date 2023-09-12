const ruLang = require('#src/utils/ru_lang')
const fetchData = require('#src/utils/helpers')
const { notifyUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { sendToLog } = require('#src/utils/log') // Добавление лога

async function handleTextCommand(ctx) {
    // Константы
    const USER_API = 'https://bot.pf-forum.ru/api/users'
    const GRAND_ADMIN = process.env.GRAND_ADMIN
    const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '-1001946496691'

    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    // Если это не админ, отправляем лог
    if (chat.id !== parseInt(GRAND_ADMIN)) await sendToLog(ctx) // функция sendToLog должна быть определена где-то в вашем коде

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment) return

    // Обработка ожидания ФИО
    if (ctx.session.isAwaitFio) {
        if (!/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\. ?[А-Яа-яёЁ]\.$/.test(text)) {
            ctx.reply(ruLang.invalidData)
            return
        }

        // Дальнейшая логика обработки ФИО
        const cleanedText = text.replace(/\. /g, '.')
        const encodedFio = encodeURIComponent(cleanedText)
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

        try {
            // Запросы на повышение ранга
            await fetchData(`${USER_API}/rank_up.php`, { id_user: userId, fio: encodedFio })
            await fetchData(`${USER_API}/rank_up2.php`, { id_user: userId, fio: encodedFio })

            // Ваша логика в случае успешного выполнения
        } catch (error) {
            console.error('Ошибка при выполнении /rank_up или /rank_up2:', error)
            await bot.telegram.sendMessage(
                GRAND_ADMIN,
                `⚠️ Ошибка при выполнении /rank_up или /rank_up2: ${error.message}`,
                { parse_mode: 'HTML' },
            )
        }

        const defMsg = `\nID: <code>${userId}</code>` +
            `\nfio: <code>${cleanedText}</code>`

        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            dataAddUser ? `⭐ Пользователь добавлен.\nДобавлена кастомная метка:${defMsg}` :
                `⚠️Ошибка регистрации${defMsg}`,
            { parse_mode: 'HTML' },
        )

        await notifyUsers(ctx)
        ctx.session.isAwaitFio = false
    }

    // Обработка ожидания комментария
    if (ctx.session.isAwaitComment) {
        await handleAddComment(ctx)
    }
}

module.exports = { handleTextCommand }
