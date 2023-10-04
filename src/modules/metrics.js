const axios = require('axios');
const moment = require('moment');

async function fetchMetrics() {
    try {
        const response = await axios.get(`${WEB_API}/metrics/get.php?key=${SECRET_KEY}`);
        return response.data.metrics || [];  // Добавьте здесь || [] для обработки undefined
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

function getMaxCharacters(latestMetrics) {
    const percentageValues = [
        latestMetrics.prod,
        latestMetrics.cumulative_brak_month,
        latestMetrics.cumulative_manager_month,
        latestMetrics.sles,
        latestMetrics.otk,
        latestMetrics.upk,
    ];
    let maxCharacters = 0;
    for (let value of percentageValues) {
        let characters = formatNumber(value).length + 1;  // +1 для знака процента
        if (characters > maxCharacters) {
            maxCharacters = characters;
        }
    }
    return maxCharacters;
}

function formatPercentage(number, maxCharacters) {
    let formattedNumber = formatNumber(number) + '%';  // Добавьте знак процента здесь
    let currentCharacters = formattedNumber.length;
    let spacesNeeded = maxCharacters - currentCharacters;
    spacesNeeded = Math.max(0, spacesNeeded);  // Убедитесь, что spacesNeeded неотрицательное
    let spaces = ' '.repeat(spacesNeeded);
    return spaces + formattedNumber;
}


async function sendMetricsNotification(ctx, index) {
    try {
        const metrics = await fetchMetrics();
        if (metrics.length === 0 || !metrics[index]) {  // Проверьте, есть ли данные и есть ли элемент с данным индексом
            throw new Error('No metrics data available');
        }

        const latestMetrics = metrics[index];
        let message = '';

        if (!latestMetrics) {  // Проверьте, определены ли latestMetrics здесь
            throw new Error('No latest metrics data available');
        }
        const maxCharacters = getMaxCharacters(latestMetrics);

        message += `Дата: <b>${moment(latestMetrics.date, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm:ss")}</b>\n`;
        message += `Не завершённое по М/О: <b>${formatNumber(latestMetrics.prod_price_mzp)}</b> ₽\n`;
        message += `Слесарный участок: <b>${formatNumber(latestMetrics.prod_price_sles)}</b> ₽\n`;
        message += `ОТК: <b>${formatNumber(latestMetrics.prod_price_otk)}</b> ₽\n`;
        message += `Упаковка: <b>${formatNumber(latestMetrics.prod_price_upk)}</b> ₽\n`;
        message += `Доработка ЧПУ: <b>${formatNumber(latestMetrics.prod_price_dorabotka)}</b> ₽\n`;
        message += `Доработка в слесарном: <b>${formatNumber(latestMetrics.prod_price_dorabotka_sles)}</b> ₽\n`;
        message += `Согласование: <b>${formatNumber(latestMetrics.prod_price_sogl)}</b> ₽\n`;

        message += `\nИтого внутреннего производства: <b>${formatNumber(latestMetrics.prod_price)}</b> ₽\n`;

        message += `\n<u>Отклонение от плана</u>\n`;
        message += `<code>${formatPercentage(latestMetrics.cumulative_sklad_month, maxCharacters)}</code> Производство\n`;
        message += `<code>${formatPercentage(latestMetrics.cumulative_brak_month, maxCharacters)}</code> Брак\n`;
        message += `<code>${formatPercentage(latestMetrics.cumulative_manager_month, maxCharacters)}</code> Отдел продаж\n`;


        message += `\n<u>Воронка</u>\n`;
        message += `<code>${formatPercentage(latestMetrics.prod, maxCharacters)}</code> Производство\n`;  // Используйте maxCharacters здесь
        message += `<code>${formatPercentage(latestMetrics.sles, maxCharacters)}</code> Слесарный участок\n`;  // Используйте maxCharacters здесь
        message += `<code>${formatPercentage(latestMetrics.otk, maxCharacters)}</code> ОТК\n`;  // Используйте maxCharacters здесь
        message += `<code>${formatPercentage(latestMetrics.upk, maxCharacters)}</code> Упаковка\n`;  // Используйте maxCharacters здесь

        message += `\nПродуктивность: <b>${formatNumber(latestMetrics.productivity)}</b> ₽/час\n`;
        message += `Отгрузка: <b>${formatNumber(latestMetrics.get_sum_otgr)}</b> ₽\n`;

        const ADMIN_IDS = [DIR_TEST_GROUP];
        for (const adminId of ADMIN_IDS) {
            try {
                await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
                console.log('Metrics Message sent successfully to adminId:', adminId);
            } catch (error) {
                console.error('Failed to send message to adminId:', adminId, 'Error:', error);
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `Не удалось отправить сообщение <code>${adminId}</code>\n<code>${error}</code>`,
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

