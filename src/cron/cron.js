const { format } = require('date-fns')
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/sk_operator/notify')
const { oplataNotification } = require('#src/modules/oplata/oplata')
const { checkBotData } = require('#src/api/api')
const {
    metricsNotificationDirector,
} = require('#src/modules/metrics/director/metrics')
const { sendLogData } = require('#src/api/api')
const {
    formatMetricsMessageMaster,
} = require('#src/modules/metrics/master/metrics')
const {
    sendMetricsMessagesNach,
} = require('#src/modules/metrics/hachalnik/metrics')
const { get } = require('axios')

// Храним расписание для отправки метрик
const metricsSchedules = {}

async function fetchMetricsData() {
    try {
        const response = await get(`${WEB_API}/metrics/get_metrica_time.php`)
        return response.data
    } catch (error) {
        console.error('Ошибка при получении данных о метриках:', error)
        return [] // Возвращаем пустой массив в случае ошибки
    }
}

async function initCronJobs(currentDateTime, instanceNumber) {

    cron.schedule('0 12 * * 0', async () => {
        console.log('Запущена еженедельная задача обновления пользователей')
        try {
            const response = await get(`${WEB_API}/extra/user_update.php`)
            console.log('Результат выполнения задачи:', response.data)
        } catch (error) {
            console.error('Ошибка при выполнении еженедельной задачи:', error)
        }
    })

    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/17 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers()
    })

    // Уведомлять об ОПЛАТЕ каждые 8 мин
    if (METRICS_REPORT_ACTIVE) { // Добавлено условие!
        cron.schedule('*/15 * * * *', async () => {
            await oplataNotification()
            // console.log('Running oplataNotification()')
        })
    }

    // Если METRICS_REPORT_ACTIVE = true, то запускаем задачи для отчетов о метриках
    if (METRICS_REPORT_ACTIVE===false) {
        console.log('METRICS_REPORT_ACTIVE')
        const metricsData = await fetchMetricsData()

        console.log(metricsData)

        // Обработка данных о метриках
        metricsData.forEach(metric => {

            const { user_id, metrica_time_h, metrica_time_m } = metric
            const schedule = `${metrica_time_m} ${metrica_time_h} * * *` // Форматирование расписания
            console.log(user_id, metrica_time_h, metrica_time_m)

            // Добавляем пользователя в массив с расписанием
            metricsSchedules[user_id] = schedule

            // Запускаем cron задание для отправки метрик раз в час
            cron.schedule('*/10 * * * * *', async () => {
                console.log(`! Running metricsNotificationDirector() for user ${user_id} at ${schedule}`)
                // Проверяем, есть ли пользователь в массиве
                if (metricsSchedules[user_id]) {
                    await metricsNotificationDirector(null, 0, user_id)
                    console.log(`Running metricsNotificationDirector() for user ${user_id} at ${schedule}`)
                }
            })
        })

        cron.schedule('0 10 * * *', async () => {
            await sendMetricsMessagesNach()
            console.log('Running sendMetricsMessagesNach() at 10:00 AM every day')
        })

        cron.schedule('0 10 * * *', async () => {
            await formatMetricsMessageMaster()
            console.log('Running formatMetricsMessageMaster() at 10:00 AM every day')
        })
    }

    if (MODE === 'build') {
        // Проверка экземпляра 12 мин
        cron.schedule('*/30 * * * *', async () => {
            stateCounter.bot_check++

            // Получаем текущую дату и время
            const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss') // Добавлено format()


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
                        { parse_mode: 'HTML' },
                    )
                    // Сначала останавливаем бота
                    bot.stop()
                    // Затем завершаем весь процесс
                    process.exit()
                }
            } catch (error) {
                const logMessageToSend = {
                    user_id: '',
                    text: error.toString(),
                    error: 1,
                    ok: 0,
                    test: process.env.NODE_ENV === 'build' ? 0 : 1,
                }
                await sendLogData(logMessageToSend)
                console.error('Ошибка данных о актуальном экземпляре:', error)
            }
        })
    }
}

module.exports = { initCronJobs }