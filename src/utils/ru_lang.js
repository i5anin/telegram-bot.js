// messages.js

const moment = require('moment')
const { formatNumber, formatPercentage } = require('#src/utils/helpers')

/**
 * Проверяет, выходит ли значение за пределы заданного диапазона (меньше 1 700 000 или больше 3 400 000),
 * и форматирует его, добавляя символ "❗", если значение вне диапазона.
 *
 * @param {number} value - Числовое значение для проверки.
 * @returns {string} - Форматированное значение с возможным символом "❗".
 */
function checkWarningAndFormat(value, category) {
  const isWithinLimits =
    (category === 'Слесарка' && value <= 3400000) ||
    ((category === 'ОТК' || category === 'Упаковка') && value <= 1700000)

  // Изменяем логику тернарного оператора, чтобы "⚠️" отображался по умолчанию
  const symbol = isWithinLimits ? '\u00A0✓' : '\u00A0⚠️' // По умолчанию для доработок, согласований и всех остальных случаев

  return `<b>${formatNumber(value)}</b> ₽${symbol}\n`
}

module.exports = {
  alreadyRegistered: '<b>Вы уже зарегистрированы!</b>',
  notRegistered:
    'Не зарегистрированы. \nВведите данные в формате:\n<code>Иванов И.И.</code>',
  registrationSuccess: 'Регистрация прошла успешно!',
  registrationError: 'Ошибка регистрации: ',
  serverError: 'Ошибка сервера.',
  invalidData: 'Формат введенных данных неверный.',
  enterData: 'Введите данные в формате <code>Иванов И.И.</code>',
  userNotFound: (userId) =>
    `Пользователь\nID: <code>${userId}</code>\n<b>не зарегистрирован в системе</b>`,
  errorAPI: 'Ошибка при получении данных с внешнего API:',
  error: 'Произошла ошибка при выполнении команды',

  payments: (paymentData) =>
    `<b>${paymentData.fio}</b>\n` +
    `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
    '<blockquote>' +
    // `Рейтинг ЦКП:  <b>${paymentData.rating_good}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_good}</b>\n` +
    // `Рейтинг Качества:  <b>${paymentData.rating_brak}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_brak}</b>\n` +
    `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
    `Грейд: <b>${paymentData.grade}</b>\n` +
    `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
    `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
    '</blockquote>' +
    `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment)}</b>\u00A0₽\n`,

  paymentsOperator: (paymentData) =>
    `<b>${paymentData.fio}</b>\n` +
    `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
    '<blockquote>' +
    `Рейтинг ЦКП:  <b>${paymentData.rating_good}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_good}</b>\n` +
    `Рейтинг Качества:  <b>${paymentData.rating_brak}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_brak}</b>\n` +
    `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
    `Грейд: <b>${paymentData.grade}</b>\n` +
    `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
    `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
    '</blockquote>' +
    `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment)}</b>\u00A0₽\n`,

  formatSKMessage: (
    det_name,
    kolvo_brak,
    controlDescription,
    defectDescription,
    comments_otk,
    specs_nom_id,
    formattedDate
  ) =>
    `${emoji.point} <b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
    `${emoji.point} <b>Количество:</b> <code>${kolvo_brak}шт.</code>\n` +
    `${emoji.point} <b>Контроль:</b> <code>${controlDescription}</code>\n` +
    `${emoji.point} <b>Комментарий ОТК:</b> <blockquote>${comments_otk}</blockquote>\n` +
    `${emoji.point} <b>Брак:</b> <code>${defectDescription}</code>\n` +
    `${emoji.point} <b>Партия:</b> <code>${specs_nom_id}</code>\n` +
    `${emoji.point} <b>Дата:</b> <code>${formattedDate}</code>\n\n`,
  formatMetricsMessage: (latestMetrics, maxCharacters) =>
    `Дата: <b>${moment(latestMetrics.date, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm:ss')}</b>\n\n` +
    `Незавершённое по М/О: <b>${formatNumber(latestMetrics.prod_price_mzp)}</b>\u00A0₽\n` +
    '<blockquote>' +
    `Cлесарка: ${checkWarningAndFormat(latestMetrics.prod_price_sles, 'Cлесарка')}` + // Слесарка меньше или равно 3 400 000
    `ОТК: ${checkWarningAndFormat(latestMetrics.prod_price_otk, 'ОТК')}` + // ОТК меньше или равно 1 700 000
    `Упаковка: ${checkWarningAndFormat(latestMetrics.prod_price_upk, 'Упаковка')}` + // Упаковка меньше или равно 1 700 000
    `Доработка ЧПУ: ${checkWarningAndFormat(latestMetrics.prod_price_dorabotka)}` +
    `Доработка слес.: ${checkWarningAndFormat(latestMetrics.prod_price_dorabotka_sles)}` +
    `Согл.: ${checkWarningAndFormat(latestMetrics.prod_price_sogl)}` +
    '</blockquote>' +
    `Итого вн. производства: <b>${formatNumber(latestMetrics.prod_price)}</b>\u00A0₽\n` +
    `Ожидаемая предоплата: <b>${formatNumber(latestMetrics.predoplata)}</b>\u00A0₽\u00A0<tg-spoiler>с\u00A0НДС</tg-spoiler>\n` +
    `Итого вн. производства: <b>${formatNumber(latestMetrics.total_price)}</b>\u00A0₽\u00A0<tg-spoiler>с\u00A0НДС</tg-spoiler>\n` +
    `Готовая продукция склад: <b>${formatNumber(latestMetrics.total_sklad_gp)}</b>\u00A0₽\u00A0<tg-spoiler>с\u00A0НДС</tg-spoiler>\n\n` +
    '<b><u>Отклонение от плана</u></b>\n' +
    `<code>${formatPercentage(latestMetrics.cumulative_sklad_month, maxCharacters)}</code> Производство\n` +
    `<code>${formatPercentage(latestMetrics.cumulative_brak_month, maxCharacters)}</code> Брак\n` +
    `<code>${formatPercentage(latestMetrics.cumulative_manager_month, maxCharacters)}</code> Отдел продаж\n\n` +
    '<b><u>Воронка</u></b>\n' +
    `<code>${formatPercentage(latestMetrics.prod, maxCharacters)}</code> Производство\n` +
    `<code>${formatPercentage(latestMetrics.sles, maxCharacters)}</code> Слесарный участок\n` +
    `<code>${formatPercentage(latestMetrics.otk, maxCharacters)}</code> ОТК\n` +
    `<code>${formatPercentage(latestMetrics.upk, maxCharacters)}</code> Упаковка\n\n` +
    `Прод. оборудования: <b>${formatNumber(latestMetrics.productivity_prod)}</b>\u00A0₽/час\n` +
    `Прод. производства: <b>${formatNumber(latestMetrics.productivity)}</b>\u00A0₽/час\n` +
    `Отгрузка М/О: <b>${formatNumber(latestMetrics.get_sum_otgr_prod)}</b>\u00A0₽\n` +
    `Отгрузка: <b>${formatNumber(latestMetrics.get_sum_otgr)}</b>\u00A0₽\u00A0<tg-spoiler>с\u00A0НДС</tg-spoiler>\n`,

  formatMetricsMessageNach: (metrics, period) =>
    `${emoji.tech} <b><u>Загрузка ${period}</u></b>\n` +
    `${emoji.point} плановая: <code>${`${formatNumber(metrics.load_plan * 100)}%`}</code>\n` +
    `${emoji.point} фактическая: <code>${`${formatNumber(metrics.load_fact * 100)}%`}</code>\n` +
    `${emoji.point} кол-во станков: <code>${metrics.cnc_count}</code>` +
    `<blockquote>${moment(metrics.date_from, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm')}\n` +
    `${moment(metrics.date_to, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm')}</blockquote>`,

  formatMetricsVoronca: (latestMetrics, maxCharacters) =>
    '<b><u>Воронка</u></b>\n' +
    `<code>${formatPercentage(latestMetrics.prod, maxCharacters)}</code> Производство\n` +
    `<code>${formatPercentage(latestMetrics.sles, maxCharacters)}</code> Слесарный участок\n` +
    `<code>${formatPercentage(latestMetrics.otk, maxCharacters)}</code> ОТК\n` +
    `<code>${formatPercentage(latestMetrics.upk, maxCharacters)}</code> Упаковка\n\n`,

  logMessage: (chatId, fio) =>
    `<b>fio:</b> <a href='tg://user?id=${chatId}'>${fio}</a>\n` +
    `<b>ID:</b> <code>${chatId}</code>`
}
