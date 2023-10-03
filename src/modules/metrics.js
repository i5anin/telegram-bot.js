// const axios = require('axios');

async function fetchMetrics() {
    try {
        const response = await fetch(`${WEB_API}/metrics/get.php?key=${SECRET_KEY}`);
        const data = await response.json();  // Добавьте эту строку
        return data.metrics;  // Измените response.data.metrics на data.metrics
    } catch (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
}

function formatNumber(number) {
    return parseFloat(number).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

async function sendMetricsNotification() {
    try {
        const metrics = await fetchMetrics()

        let message = ''
        metrics.forEach(metric => {
            const formattedValue = formatNumber(metric.value)
            message += `${metric.name}: <b>${formattedValue}</b> ${metric.unit}\n`
        })

        const ADMIN_IDS = [OPLATA_GROUP]
        for (const adminId of ADMIN_IDS) {
            try {
                await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
                console.log('Message sent successfully to adminId:', adminId)
            } catch (error) {
                console.error('Failed to send message to adminId:', adminId, 'Error:', error)
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `Failed to send metrics message to <code>${adminId}</code>\n<code>${error}</code>`,
                    { parse_mode: 'HTML' },
                )
            }
        }
    } catch (error) {
        console.error('Error fetching or sending metrics:', error)
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Error fetching or sending metrics\n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

module.exports = { sendMetricsNotification }
