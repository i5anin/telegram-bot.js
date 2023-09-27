const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')
const { oplataNotification } = require('#src/modules/oplata')
const { checkBotData } = require('#src/api/index')

function initCronJobs(currentDateTime, instanceNumber) {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/15 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers(ctx)
    })

    // !!! Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        await oplataNotification()
    })

    if (MODE === 'build') {
        // Проверка экземпляра
        cron.schedule('*/3 * * * *', async () => {
            stateCounter.bot_check++

            try {
                const response = await checkBotData(formattedDateTime, instanceNumber)
                console.log('Данные о актуальном экземляре:', response.data.latest_entry)

                // Получаем текущую дату и время
                const formattedDateTime = `${currentDateTime.getFullYear()}-${String(currentDateTime.getMonth() + 1).padStart(2, '0')}-${String(currentDateTime.getDate()).padStart(2, '0')} ${String(currentDateTime.getHours()).padStart(2, '0')}:${String(currentDateTime.getMinutes()).padStart(2, '0')}:${String(currentDateTime.getSeconds()).padStart(2, '0')}`
                console.log('formattedDateTime=', formattedDateTime, 'instanceNumber=', instanceNumber)

                // Проверяем соответствие
                if (formattedDateTime !== response.data.latest_entry.date || instanceNumber !== response.data.latest_entry.random_key) {
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
