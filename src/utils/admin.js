// Функция лог в спец чат
async function sendToLog(ctx) {
    const { chat, from, text } = ctx.message
    if (chat.id !== parseInt(GRAND_ADMIN)) {
        const username = from.username ? '@' + from.username : '<code>N/A</code>'
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `ID <code>${chat.id}</code>` +
            ` username: ${username}` +
            `\nname: <code>${from.first_name || 'N/A'} ${from.last_name || 'N/A'}</code>` +
            `\nmsg: <code>${text}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

async function handleMsgCommand(ctx) {
    // Проверяем, является ли отправитель грант-админом
    if (ctx.from.id.toString() === GRAND_ADMIN) {
        // Разбиваем текст сообщения на части, чтобы извлечь ID и само сообщение
        const parts = ctx.message.text.split(' ')
        if (parts.length < 3) return ctx.reply('Недостаточно аргументов. Используйте /msg [id] [Сообщение]')

        const userId = parts[1]
        const message = parts.slice(2).join(' ')

        // Отправляем сообщение
        try {
            await bot.telegram.sendMessage(userId, message)
            ctx.reply('Сообщение успешно отправлено.')
        } catch (error) {
            ctx.reply(`Ошибка при отправке сообщения: ${error}`)
        }
    }
}
// Функция для обработки команды /status
async function handleStatusCommand(ctx, instanceNumber) {
    await ctx.reply(`Текущий номер экземпляра: ${instanceNumber}`)
}

module.exports = { handleStatusCommand, sendToLog, handleMsgCommand }