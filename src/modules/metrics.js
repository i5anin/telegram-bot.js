const axios = require('axios');

async function fetchMetrics() {
    try {
        const response = await axios.get(`${WEB_API}/metrics/get.php?key=${SECRET_KEY}`);
        return response.data.metrics;
    } catch (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
}

function formatNumber(number) {
    return parseFloat(number).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).replace(/,00$/, '');  // Убираем ,00 для целых чисел
}

async function sendMetricsNotification() {
    try {
        const metrics = await fetchMetrics();
        let message = '';
        const groupTitles = {
            3: '\nНе завершённое по М/О: \n',
            4: '\nИтого внутреннего производства: ',
            5: '\nОтклонение от плана \n',
            6: '\nВоронка\n'
        };

        metrics.forEach((metric, index) => {
            const formattedValue = formatNumber(metric.value);
            const groupTitle = groupTitles[metric.id] || '';
            message += groupTitle;
            message += `<b>${metric.name}:</b> ${formattedValue} ${metric.unit}\n`;
        });



        const ADMIN_IDS = [OPLATA_GROUP];
        for (const adminId of ADMIN_IDS) {
            try {
                await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
                console.log('Message sent successfully to adminId:', adminId);
            } catch (error) {
                console.error('Failed to send message to adminId:', adminId, 'Error:', error);
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `Failed to send metrics message to <code>${adminId}</code>\n<code>${error}</code>`,
                    { parse_mode: 'HTML' }
                );
            }
        }
    } catch (error) {
        console.error('Error fetching or sending metrics:', error);
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Error fetching or sending metrics\n<code>${error}</code>`,
            { parse_mode: 'HTML' }
        );
    }
}

module.exports = { sendMetricsNotification };
