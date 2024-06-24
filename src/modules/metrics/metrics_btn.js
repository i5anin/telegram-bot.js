const moment = require('moment/moment')

async function tableMetrics(ctx) {
    // Получение актуальных данных с API
    const response = await fetch(
        `${WEB_API}/metrics/get.php?key=SecretKeyPFForum23`,
    )
    const data = await response.json()
    const latestMetrics = data.metrics[data.metrics.length - 1] // Берем последние данные

    // Создание кнопок
    const keyboard = [
        [
            { text: 'Дата', callback_data: 'date' },
            {
                text: `${moment(latestMetrics.date, 'YYYY-MM-DD HH:mm:ss').format(
                    'DD.MM.YYYY HH:mm',
                )}`,
                callback_data: 'date_data',
            },
        ],
        [
            { text: 'Незавершённое по М/О', callback_data: 'mzp' },
            {
                text: `${formatNumber(latestMetrics.prod_price_mzp)} ₽`,
                callback_data: 'mzp_data',
            },
        ],
        [
            { text: 'Cлесарка', callback_data: 'sles' },
            {
                text: `${formatNumber(latestMetrics.prod_price_sles)} ₽ ${
                    latestMetrics.prod_price_sles <= 3400000
                        ? '🟢'
                        : latestMetrics.prod_price_sles > 3400000
                            ? '🔴'
                            : ''
                }`,
                callback_data: 'sles_data',
            },
        ],
        [
            { text: 'ОТК', callback_data: 'otk' },
            {
                text: `${formatNumber(latestMetrics.prod_price_otk)} ₽ ${
                    latestMetrics.prod_price_otk <= 1700000
                        ? '🟢'
                        : latestMetrics.prod_price_otk > 1700000
                            ? '🔴'
                            : ''
                }`,
                callback_data: 'otk_data',
            },
        ],
        [
            { text: 'Упаковка', callback_data: 'upk' },
            {
                text: `${formatNumber(latestMetrics.prod_price_upk)} ₽ ${
                    latestMetrics.prod_price_upk <= 1700000
                        ? '🟢'
                        : latestMetrics.prod_price_upk > 1700000
                            ? '🔴'
                            : ''
                }`,
                callback_data: 'upk_data',
            },
        ],
        [
            { text: 'Доработка ЧПУ', callback_data: 'dorabotka' },
            {
                text: `${formatNumber(latestMetrics.prod_price_dorabotka)} ₽ 🔴`,
                callback_data: 'dorabotka_data',
            },
        ],
        [
            { text: 'Доработка слес.', callback_data: 'dorabotka_sles' },
            {
                text: `${formatNumber(latestMetrics.prod_price_dorabotka_sles)} ₽ 🔴`,
                callback_data: 'dorabotka_sles_data',
            },
        ],
        [
            { text: 'Согласование', callback_data: 'sogl' },
            {
                text: `${formatNumber(latestMetrics.prod_price_sogl)} ₽ 🔴`,
                callback_data: 'sogl_data',
            },
        ],
        [
            { text: 'Итого вн. производства', callback_data: 'prod_price' },
            {
                text: `${formatNumber(latestMetrics.prod_price)} ₽`,
                callback_data: 'prod_price_data',
            },
        ],
        [
            { text: 'Ожидаемая предоплата', callback_data: 'predoplata' },
            {
                text: `${formatNumber(latestMetrics.predoplata)} ₽`,
                callback_data: 'predoplata_data',
            },
        ],
        [
            { text: 'Итого вн. производства', callback_data: 'total_price' },
            {
                text: `${formatNumber(latestMetrics.total_price)} ₽ (с НДС)`,
                callback_data: 'total_price_data',
            },
        ],
        [
            {
                text: 'Готовая продукция склад',
                callback_data: 'total_sklad_gp',
            },
            {
                text: `${formatNumber(latestMetrics.total_sklad_gp)} ₽ (с НДС)`,
                callback_data: 'total_sklad_gp_data',
            },
        ],
        [{ text: 'Отклонение от плана', callback_data: 'cumulative' }],
        [
            { text: 'Производство', callback_data: 'cumulative' },
            {
                text: `${formatPercentage(latestMetrics.cumulative_sklad_month, 2)}%`,
                callback_data: 'cumulative_sklad_month_data',
            },
        ],
        [
            { text: 'Брак', callback_data: 'brak' },
            {
                text: `${formatPercentage(latestMetrics.cumulative_brak_month, 2)}%`,
                callback_data: 'cumulative_brak_month_data',
            },
        ],
        [
            { text: 'Отдел продаж', callback_data: 'manager' },
            {
                text: `${formatPercentage(latestMetrics.cumulative_manager_month, 2)}%`,
                callback_data: 'cumulative_manager_month_data',
            },
        ],
        [{ text: 'Воронка', callback_data: 'voronka' }],
        [
            { text: '▽ Производство', callback_data: 'voronka' },
            {
                text: `${formatPercentage(latestMetrics.prod, 2)}%`,
                callback_data: 'prod_data',
            },
        ],
        [
            { text: '▽ Слесарный участок', callback_data: 'sles' },
            {
                text: `${formatPercentage(latestMetrics.sles, 2)}%`,
                callback_data: 'sles_data_2',
            },
        ],
        [
            { text: '▽ ОТК', callback_data: 'otk' },
            {
                text: `${formatPercentage(latestMetrics.otk, 2)}%`,
                callback_data: 'otk_data_2',
            },
        ],
        [
            { text: '▽ Упаковка', callback_data: 'upk' },
            {
                text: `${formatPercentage(latestMetrics.upk, 2)}%`,
                callback_data: 'upk_data_2',
            },
        ],
        [
            { text: 'Прод. оборудования', callback_data: 'productivity_prod' },
            {
                text: `${formatNumber(latestMetrics.productivity_prod)} ₽/час`,
                callback_data: 'productivity_prod_data',
            },
        ],
        [
            { text: 'Прод. производства', callback_data: 'productivity' },
            {
                text: `${formatNumber(latestMetrics.productivity)} ₽/час`,
                callback_data: 'productivity_data',
            },
        ],
        [
            { text: 'Отгрузка М/О', callback_data: 'otgr_prod' },
            {
                text: `${formatNumber(latestMetrics.get_sum_otgr_prod)} ₽`,
                callback_data: 'otgr_prod_data',
            },
        ],
        [
            { text: 'Отгрузка', callback_data: 'otgr' },
            {
                text: `${formatNumber(latestMetrics.get_sum_otgr)} ₽ (с НДС)`,
                callback_data: 'otgr_data',
            },
        ],
    ]

    // Отправка сообщения с кнопками
    await ctx.reply('Выберите показатель:', {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: 'HTML',
    })
}

// Функция для форматирования числа (с тысячными разделителями)
function formatNumber(number) {
    return Math.round(number)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Функция для форматирования процента (с округлением до 2 знаков после запятой)
function formatPercentage(value, decimals) {
    return value.toFixed(decimals)
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

module.exports = {
    tableMetrics,
}
