const moment = require('moment')
const { checkUser } = require('#src/api/index')
const { fetchMetrics } = require('#src/api/index')
const { sendToLog } = require('#src/utils/log')
const { formatMetricsMessage } = require('#src/utils/ru_lang')
const { formatNumber } = require('#src/utils/helpers')


function getMaxCharacters(latestMetrics) {
    const percentageValues = [latestMetrics.prod, latestMetrics.cumulative_brak_month, latestMetrics.cumulative_manager_month, latestMetrics.sles, latestMetrics.otk, latestMetrics.upk]
    let maxCharacters = 0
    for (let value of percentageValues) {
        let characters = formatNumber(value).length + 1  // +1 для знака процента
        if (characters > maxCharacters) {
            maxCharacters = characters
        }
    }
    return maxCharacters
}




async function metricsNotification(ctx = null, index = 0) {
    try {
        const metrics = await fetchMetrics()
        if (metrics.length === 0 || !metrics[index]) {
            throw new Error('No metrics data available')
        }

        const latestMetrics = metrics[index]
        const maxCharacters = getMaxCharacters(latestMetrics)
        const message = formatMetricsMessage(latestMetrics, maxCharacters)
        if (index === 1) {
            await sendToLog(ctx)
            const chatId = ctx.chat.id  // Получите chatId из контекста
            const userCheck = await checkUser(chatId)  // Проверьте пользователя

            if (!userCheck.exists || (userCheck.role !== 'admin' && userCheck.role !== 'dir')) {
                console.error(`User ${chatId} does not have the necessary permissions.`)
                return  // Если у пользователя нет необходимых прав, просто возвращаемся из функции
            }
            await ctx.reply(message, { parse_mode: 'HTML' })
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Запрос метрики <code>${ctx.from.id}</code>\n` + message, { parse_mode: 'HTML' })
        } else {
            const ADMIN_IDS = [DIR_METRIC, DIR_OPLATA, DIR_TEST_GROUP] //1164924330 - Лера
            for (const adminId of ADMIN_IDS) {
                try {
                    await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
                    console.log('Metrics Message sent successfully to adminId:', adminId)
                } catch (error) {
                    console.error('Failed to send message to adminId:', adminId, 'Error:', error)
                    await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение <code>${adminId}</code>\n<code>${error}</code>`, { parse_mode: 'HTML' })
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or sending metrics:', error)
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Error fetching or sending metrics\n<code>${error}</code>`, { parse_mode: 'HTML' })
    }
}

module.exports = { metricsNotification }

