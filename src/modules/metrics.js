// Подключение необходимых библиотек и модулей
// const axios = require('axios'); // Если вы используете axios
const fetch = require('node-fetch');  // Если вы используете fetch

// Функция для получения метрик
async function fetchMetrics() {
    try {
        const response = await fetch(`${WEB_API}/metrics/get.php?key=${SECRET_KEY}`);
        const data = await response.json();
        return data.metrics;
    } catch (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
}

// Функция для форматирования числа
function formatNumber(number, isFractional) {
    return parseFloat(number).toLocaleString('ru-RU', {
        minimumFractionDigits: isFractional ? 2 : 0,
        maximumFractionDigits: isFractional ? 2 : 0,
    });
}

// Функция для отправки уведомления с метриками
async function sendMetricsNotification() {
    try {
        const metrics = await fetchMetrics();

        let message = '';
        let groupTitle = '';
        metrics.forEach((metric, index) => {
            const isFractional = metric.unit.includes('/');
            const formattedValue = formatNumber(metric.value, isFractional);

            if (metric.name === 'Не завершённое по М/О') {
                groupTitle = '\n' + metric.name + ': \n';
            } else if (metric.name === 'Итого внутреннего производства') {
                groupTitle = '\n' + metric.name + ': ';
            } else if (metric.name === 'Отклонение от плана Производства') {
                groupTitle = '\nОтклонение от плана \n';
            } else if (metric.name === 'Воронка Производство') {
                groupTitle = '\nВоронка\n';
            } else {
                groupTitle = '';
            }

            message += `${groupTitle}<b>${metric.name}:</b> ${formattedValue} ${metric.unit}\n`;
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

// Экспорт функции для использования в других модулях
module.exports = { sendMetricsNotification };
