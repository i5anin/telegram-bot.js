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

// Функция для обработки команды /status
async function handleStatusCommand(ctx, instanceNumber) {
    await ctx.reply(`Текущий номер экземпляра: ${instanceNumber}`)
}

module.exports = { handleStatusCommand, sendToLog }