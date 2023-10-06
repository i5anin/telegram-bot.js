const ruLang = require('#src/utils/ru_lang')

const { handleAddComment } = require('#src/modules/comment')
const { notifyUsers } = require('#src/modules/notify')
const { sendToLog } = require('#src/utils/log')
const { addUser } = require('#src/api/index')

async function handleTextCommand(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment && !ctx.message.reply_to_message) return

    // --------- Обработка ожидания ФИО ---------
    if (ctx.session.isAwaitFio && ctx.chat.type === 'private') {
        console.log('ctx.session.isAwaitFio=', ctx.session.isAwaitFio)
        if (!/^[А-Яа-яёЁëË]+\s[А-Яа-яёЁëË]\. ?[А-Яа-яёЁëË]\.$/.test(text)) { //налог с диакритическим знаком "ë"
            ctx.reply(ruLang.invalidData)
            return
        }
        // Дальнейшая логика обработки ФИО
        const cleanedText = text.replace(/ë/g, 'ё').replace(/Ë/g, 'Ё').replace(/\. /g, '.')
        const userId = chat.id

        try {
            // Запрос на добавление пользователя
            const dataAddUser = await addUser(userId, cleanedText, from.username)
            console.log('dataAddUser=', dataAddUser)
            if (dataAddUser && dataAddUser.status === 'OK') {
                ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })
                const defMsg = `\nID: <code>${userId}</code>` +
                    `\nfio: <code>${cleanedText}</code>`

                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID, `${emoji.star}Пользователь добавлен.${defMsg}`,
                    { parse_mode: 'HTML' },
                )
                await notifyUsers(ctx)
            } else {
                throw new Error(dataAddUser ? dataAddUser.message : '\nНеизвестная ошибка при добавлении пользователя.')
            }
        } catch (error) {
            console.error('Ошибка при добавлении пользователя:', error.message);
            ctx.reply(`Ошибка регистрации: ${error.message}`, { parse_mode: 'HTML' });
            const defMsg = `\nID: <code>${userId}</code>` +
                `\nfio: <code>${cleanedText}</code>`

            await bot.telegram.sendMessage(
                LOG_CHANNEL_ID, `⚠️Ошибка регистрации${defMsg}`,
                { parse_mode: 'HTML' },
            )
        }
        ctx.session.isAwaitFio = false
    }


    // --------- Обработка ожидания комментария ---------
    if (ctx.message.reply_to_message) {
        await handleAddComment(ctx)
        console.log('Обработка ожидания комментария handleAddComment')
    }
}

module.exports = { handleTextCommand }

