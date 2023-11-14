// messages.js

const moment = require('moment')
const { formatNumber, formatPercentage } = require('#src/utils/helpers')

module.exports = {
    alreadyRegistered: '<b>Вы уже зарегистрированы!</b>',
    notRegistered: 'Не зарегистрированы. \nВведите данные в формате:\n<code>Иванов И.И.</code>',
    registrationSuccess: 'Регистрация прошла успешно!',
    registrationError: 'Ошибка регистрации: ',
    serverError: 'Ошибка сервера.',
    invalidData: 'Формат введенных данных неверный.',
    enterData: 'Введите данные в формате <code>Иванов И.И.</code>',
    userNotFound: (userId) => `Пользователь\nID: <code>${userId}</code>\n<b>не зарегистрирован в системе</b>`,
    errorAPI: 'Ошибка при получении данных с внешнего API:',
    error: 'Произошла ошибка при выполнении команды',
    formatSKMessage: (det_name, kolvo_brak, controlDescription, defectDescription, comments_otk, specs_nom_id, formattedDate) =>
        `· <b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `· <b>Количество:</b> <code>${kolvo_brak}шт.</code>\n` +
        `· <b>Контроль:</b> <code>${controlDescription}</code>\n` +
        `· <b>Комментарий ОТК:</b> <blockquote>${comments_otk}</blockquote>\n` +
        `· <b>Брак:</b> <code>${defectDescription}</code>\n` +
        `· <b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `· <b>Дата:</b> <code>${formattedDate}</code>\n\n`,
    formatMetricsMessage: (latestMetrics, maxCharacters) =>
        `Дата: <b>${moment(latestMetrics.date, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm:ss')}</b>\n\n` +
        `Незавершённое по М/О: <b>${formatNumber(latestMetrics.prod_price_mzp)}</b>\u00A0₽\n` +
        `Слесарный участок: <b>${formatNumber(latestMetrics.prod_price_sles)}</b>\u00A0₽\n` +
        `ОТК: <b>${formatNumber(latestMetrics.prod_price_otk)}</b>\u00A0₽\n` +
        `Упаковка: <b>${formatNumber(latestMetrics.prod_price_upk)}</b>\u00A0₽\n` +
        `Доработка ЧПУ: <b>${formatNumber(latestMetrics.prod_price_dorabotka)}</b>\u00A0₽\n` +
        `Доработка в слесарном: <b>${formatNumber(latestMetrics.prod_price_dorabotka_sles)}</b>\u00A0₽\n` +
        `Согласование: <b>${formatNumber(latestMetrics.prod_price_sogl)}</b>\u00A0₽\n\n` +
        `Итого внутреннего производства: <b>${formatNumber(latestMetrics.prod_price)}</b>\u00A0₽\n` +
        `Ожидаемая предоплата с НДС: <b>${formatNumber(latestMetrics.predoplata)}</b>\u00A0₽\n` +
        `Итого внутреннего производства с НДС: <b>${formatNumber(latestMetrics.total_price)}</b>\u00A0₽\n` +
        `Готовая продукция на складе с НДС: <b>${formatNumber(latestMetrics.total_sklad_gp)}</b>\u00A0₽\n\n` +
        `<b><u>Отклонение от плана</u></b>\n` +
        `<code>${formatPercentage(latestMetrics.cumulative_sklad_month, maxCharacters)}</code> Производство\n` +
        `<code>${formatPercentage(latestMetrics.cumulative_brak_month, maxCharacters)}</code> Брак\n` +
        `<code>${formatPercentage(latestMetrics.cumulative_manager_month, maxCharacters)}</code> Отдел продаж\n\n` +
        `<b><u>Воронка</u></b>\n` +
        `<code>${formatPercentage(latestMetrics.prod, maxCharacters)}</code> Производство\n` +
        `<code>${formatPercentage(latestMetrics.sles, maxCharacters)}</code> Слесарный участок\n` +
        `<code>${formatPercentage(latestMetrics.otk, maxCharacters)}</code> ОТК\n` +
        `<code>${formatPercentage(latestMetrics.upk, maxCharacters)}</code> Упаковка\n\n` +
        `Продуктивность: <b>${formatNumber(latestMetrics.productivity)}</b>\u00A0₽/час\n` +
        `Отгрузка М/О: <b>${formatNumber(latestMetrics.get_sum_otgr_prod)}</b>\u00A0₽\n` +
        `Отгрузка с НДС: <b>${formatNumber(latestMetrics.get_sum_otgr)}</b>\u00A0₽\n`,

    formatMetricsMessageNach: (metrics, period) =>
        `${emoji.tech} <b><u>Загрузка ${period}</u></b>\n` +
        `• плановая: <code>${formatNumber(metrics.load_plan * 100) + '%'}</code>\n` +
        `• фактическая: <code>${formatNumber(metrics.load_fact * 100) + '%'}</code>\n\n` +
        `Кол-во станков: <code>${metrics.cnc_count}</code>\n` +
        `c <code>${moment(metrics.date_from, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm')}</code> ` +
        `до <code>${moment(metrics.date_to, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm')}</code>`,

    formatMetricsVoronca: (latestMetrics, maxCharacters) =>
        `<b><u>Воронка</u></b>\n` +
        `<code>${formatPercentage(latestMetrics.prod, maxCharacters)}</code> Производство\n` +
        `<code>${formatPercentage(latestMetrics.sles, maxCharacters)}</code> Слесарный участок\n` +
        `<code>${formatPercentage(latestMetrics.otk, maxCharacters)}</code> ОТК\n` +
        `<code>${formatPercentage(latestMetrics.upk, maxCharacters)}</code> Упаковка\n\n`,

    logMessage: (chatId, fio, username, fullName) =>
        `<b>fio:</b> <a href='tg://user?id=${chatId}'>${fio}</a>\n` +
        `<b>ID:</b> <code>${chatId}</code>`,
}
