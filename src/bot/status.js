const { format } = require('date-fns')

// Функция для обработки команды /status
async function handleStatusCommand(ctx, instanceNumber, currentDateTime) {
  const formattedDateTime = format(currentDateTime, 'HH:mm:ss dd.MM.yyyy')
  await ctx.reply(
    `Ключ запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${formattedDateTime}</code>`,
    { parse_mode: 'HTML' }
  )
}

module.exports = { handleStatusCommand }
