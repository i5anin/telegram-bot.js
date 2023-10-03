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
        metrics.forEach((metric, index) => {
            const formattedValue = formatNumber(metric.value);
            // Добавляем заголовки для групп
            if (metric.name === 'Не завершённое по М/О') {
                message += '\nНе завершённое по М/О: \n';
            } else if (metric.name === 'Итого внутреннего производства') {
                message += '\nИтого внутреннего производства: ';
            } else if (metric.name === 'Отклонение от плана Производства') {
                message += '\nОтклонение от плана \n';
            } else if (metric.name === 'Воронка Производство') {
                message += '\nВоронка\n';
            }
            // Форматируем метрику и добавляем ее в сообщение
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
