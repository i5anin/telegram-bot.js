// #src/modules/cron.mjs (make sure to use the .mjs extension)

import cron from 'node-cron'
import { notifyAllUsers } from '#src/modules/notify'
import { oplataNotification } from '#src/modules/oplata'
import { checkBotData } from '#src/api/index'
import {
  metricsNotificationDirector,
  metricsNotificationProiz,
  formatMetricsMessageMaster
} from '#src/modules/metrics'
import { format } from 'date-fns'

function initCronJobs(currentDateTime, instanceNumber) {
  // Уведомлять о сообщениях каждые 15 мин
  cron.schedule('*/17 8-23 * * *', async () => {
    console.log('notifyAllUsers Running a task every 15 minutes')
    await notifyAllUsers()
  })

  // Уведомлять об ОПЛАТЕ каждые 8 мин
  cron.schedule('*/15 * * * *', async () => {
    await oplataNotification()
    console.log('Running oplataNotification()')
  })

  if (!METRICS_REPORT_ACTIVE) {
    return
  } else {
    // Schedule for DIR_METRIC at 7:30 AM every day
    cron.schedule('30 7 * * *', async () => {
      await metricsNotificationDirector(null, 0, DIR_METRIC)
      console.log(
        'Running metricsNotificationDirector() for DIR_METRIC at 7:30 AM every day'
      )
    })

    // Schedule for DIR_OPLATA at 7:00 AM every day
    cron.schedule('0 7 * * *', async () => {
      await metricsNotificationDirector(null, 0, DIR_OPLATA)
      console.log(
        'Running metricsNotificationDirector() for DIR_OPLATA at 7:00 AM every day'
      )
    })

    // Schedule for KISELEV at 7:00 AM every day
    cron.schedule('30 7 * * *', async () => {
      await metricsNotificationDirector(null, 0, KISELEV)
      console.log(
        'Running metricsNotificationDirector() for KISELEV at 7:00 AM every day'
      )
    })

    cron.schedule('0 10 * * *', async () => {
      await metricsNotificationProiz()
      console.log('Running metricsNotificationProiz() at 10:00 AM every day')
    })
  }

  if (MODE === 'build') {
    // Проверка экземпляра 12 мин
    cron.schedule('*/30 * * * *', async () => {
      stateCounter.bot_check++

      // Получаем текущую дату и время
      const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')
      console.log(
        'formattedDateTime=',
        formattedDateTime,
        'instanceNumber=',
        instanceNumber
      )

      try {
        const response = await checkBotData(formattedDateTime, instanceNumber)

        // Проверяем соответствие
        if (
          formattedDateTime !== response.latest_entry.date ||
          instanceNumber !== response.latest_entry.random_key
        ) {
          console.error('Несоответствие данных! Останавливаем бота.')
          await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            emoji.x + 'Несоответствие данных! Останавливаем бота.',
            { parse_mode: 'HTML' }
          )
          // Сначала останавливаем бота
          bot.stop()
          // Затем завершаем весь процесс
          process.exit()
        }
      } catch (error) {
        console.error('Ошибка данных о актуальном экземпляре:', error)
      }
    })
  }
}

export { initCronJobs }
