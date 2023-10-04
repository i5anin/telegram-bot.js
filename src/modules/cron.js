const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')
const { oplataNotification } = require('#src/modules/oplata')
const { checkBotData } = require('#src/api/index')
const { format } = require('date-fns')
const { metricsNotification } = require('#src/modules/metrics') // импортируйте функцию format

function initCronJobs(currentDateTime, instanceNumber) {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/15 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers()
    })

    // Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        await oplataNotification()
    })


    cron.schedule('0 0 8 * * *', async () => {
        await metricsNotification();
    });


    if (MODE === 'build') {
        // Проверка экземпляра
        cron.schedule('*/5 * * * *', async () => {
            stateCounter.bot_check++

            // Получаем текущую дату и время
            const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')
            console.log('formattedDateTime=', formattedDateTime, 'instanceNumber=', instanceNumber)

            try {
                const response = await checkBotData(formattedDateTime, instanceNumber)

                // Проверяем соответствие
                if (formattedDateTime !== response.latest_entry.date || instanceNumber !== response.latest_entry.random_key) {
                    console.error('Несоответствие данных! Останавливаем бота.')
                    await bot.telegram.sendMessage(LOG_CHANNEL_ID, emoji.x + 'Несоответствие данных! Останавливаем бота.', { parse_mode: 'HTML' })
                    // Сначала останавливаем бота
                    bot.stop()
                    // Затем завершаем весь процесс
                    process.exit()
                }
            } catch (error) {
                console.error('Ошибка данных о актуальном экземляре:', error)
            }
        })
    }
}

module.exports = { initCronJobs }
