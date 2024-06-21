// cron_build.js
const cron = require('node-cron')
const { checkBotData } = require('#src/api/api')
const { sendLogData } = require('#src/api/api')
const { format } = require('date-fns')

function initBotCron(currentDateTime, instanceNumber) {
    if (MODE === 'build') {
        // Проверка экземпляра 12 мин
        cron.schedule('*/30 * * * *', async () => {
            stateCounter.bot_check++

            // Получаем текущую дату и время
            const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')
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

module.exports = { initBotCron }