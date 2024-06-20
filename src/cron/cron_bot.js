// cron_bot.js
const { format } = require('date-fns')
const { checkBotData } = require('#src/api/api')
const { sendLogData } = require('#src/api/api')
const { updateMetricsSchedules } = require('#src/modules/metrics/cron/metrics')

// ... Импортируйте другие модули с cron-задачами

async function cronBot(currentDateTime, instanceNumber) {
    // Задержка, чтобы дать время обновиться metricsSchedules
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 секунда задержки

    // Задача для отправки отчетов о метриках (METRICS_REPORT_ACTIVE = false)
    if (METRICS_REPORT_ACTIVE === false) {
        console.log('METRICS_REPORT_ACTIVE')

        // Загружаем данные о метриках один раз при запуске
        // (updateMetricsSchedules() уже позаботится об обновлении cron)
        await updateMetricsSchedules()
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

module.exports = { cronBot }