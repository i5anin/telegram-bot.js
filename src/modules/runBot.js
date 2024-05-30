import { format } from 'date-fns'
import { updateBotData } from '#src/api/index'
import { initCronJobs } from '#src/modules/cron'
import chalk from 'chalk'

function runBot(stateCounter) {
  // Генерация случайного номера экземпляра и получение текущего времени
  const instanceNumber = Math.floor(Math.random() * 9000) + 1000
  const currentDateTime = new Date()

  // Инициализация cron-заданий
  initCronJobs(currentDateTime, instanceNumber)

  // Сохранение номера экземпляра для метрик
  stateCounter.instanceNumber = instanceNumber

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

  // Теперь мы можем использовать formattedDateTime здесь
  console.log(chalk.green(`! Номер экземпляра : ${instanceNumber}\n!`))
  console.log(chalk.green(`! Время запуска ${formattedDateTime}`))
  console.log(chalk.orange('MODE = development'))
  console.log(chalk.orange('OPLATA_REPORT_ACTIVE = false'))
  console.log(chalk.orange('METRICS_REPORT_ACTIVE = false'))

  if (MODE === 'build') {
    bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      emoji.bot +
        `Запуск бота!\nКлюч запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${format(currentDateTime, 'HH:mm:ss dd.MM.yyyy')}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export { runBot }
