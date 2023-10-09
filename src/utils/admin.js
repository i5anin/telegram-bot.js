const { format } = require('date-fns')

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
            ctx.reply(`Ошибка при отправке сообщения:\n<code>${error}</code>`,{ parse_mode: 'HTML' })
        }
    }
}

// Функция для обработки команды /status
async function handleStatusCommand(ctx, instanceNumber, currentDateTime) {
    const formattedDateTime = format(currentDateTime, 'HH:mm:ss dd.MM.yyyy')
    await ctx.reply(`Ключ запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${formattedDateTime}</code>`,{ parse_mode: 'HTML' })
}

module.exports = { handleStatusCommand, handleMsgCommand }