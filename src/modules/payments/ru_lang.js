// messages.js

function getColorEmoji(color) {
  switch (color) {
    case 'green':
      return '🟢'
    case 'red':
      return '🔴'
    case 'blue':
      return '🔵'
    case 'white':
      return '⚪️'
    default:
      return '' // Возвращает пустую строку, если цвет не соответствует ни одному из заданных
  }
}

const operatorTypeMapping = {
  f: 'Фрезер',
  t: 'Токарь'
}

const moment = require('moment')
const {
  formatNumber,
  formatPercentage
} = require('#src/modules/sk_operator/helpers')

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
    `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
    `<b>${paymentData.post || ''}</b>\n` +
    `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
    '<blockquote>' +
    `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
    `Грейд: <b>${paymentData.grade}</b>\n` +
    `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
    `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
    `Изм. средней зарплаты:\u00A0\u00A0<b>${paymentData.payments_diff}</b>\u00A0%\n` +
    '</blockquote>' +
    `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment * (1 - 0.13))}</b>\u00A0₽\n`,

  //🟢🔴🔵⚪️

  paymentsOperator: (paymentData) =>
    `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
    `<b>${paymentData.post || ''} (${operatorTypeMapping[paymentData.operator_type] || ''})</b>\n` +
    `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
    '<blockquote>' +
    `Рейтинг ЦКП:  <b>${paymentData.rating_good}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_good}</b>\n` +
    `Рейтинг Качества:  <b>${paymentData.rating_brak}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_brak}</b>\n` +
    `Смена:\u00A0\u00A0<b>${paymentData.smena}</b>\u00A0` +
    `ЦКП:\u00A0\u00A0<b>${formatNumber(paymentData.kpi)}</b>\u00A0` +
    `Рейтинг:\u00A0\u00A0<b>${paymentData.rating_pos}</b>\u00A0\n` +
    `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
    `Грейд: <b>${paymentData.grade}</b>\n` +
    `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
    `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
    `Изм. средней зарплаты:\u00A0\u00A0<b>${paymentData.payments_diff.toFixed(2)}</b>\u00A0%\n` +
    `Отклонение участка ЧПУ:\u00A0\u00A0<b>${paymentData.prod_diff.toFixed(2)}</b>\u00A0%\n` +
    '</blockquote>' +
    `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment * (1 - 0.13))}</b>\u00A0₽\n`
}
