const { format } = require('date-fns')
const { updateBotData } = require('#src/api/index')

function runBot(instanceNumber, currentDateTime) {
  // Объявляем formattedDateTime здесь, чтобы оно было доступно вне блока if
  const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')

  if (MODE === 'build') {
    // Отправка данных при запуске бота
    updateBotData(formattedDateTime, instanceNumber)
      .then((response) => {
        console.log(
          'The bot launch data has been successfully logged:',
          response
        )
      })
      .catch((error) => {
        console.error('Error of registration of bot start data:', error.message)
      })
  }

  console.log(
    '\x1b[32m%s\x1b[0m',
    `! Номер запущенного экземпляра : ${instanceNumber}`
  )
  console.log('\x1b[34m%s\x1b[0m', `Время запуска [${currentDateTime}]`)
  console.log(
    '\x1b[31m%s\x1b[0m',
    'OPLATA_REPORT_ACTIVE =',
    OPLATA_REPORT_ACTIVE
  )
  console.log(
    '\x1b[31m%s\x1b[0m',
    'METRICS_REPORT_ACTIVE =',
    METRICS_REPORT_ACTIVE
  )

  if (MODE === 'build') {
    bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      emoji.bot +
        `Запуск бота!\nКлюч запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${format(currentDateTime, 'HH:mm:ss dd.MM.yyyy')}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

module.exports = { runBot }
