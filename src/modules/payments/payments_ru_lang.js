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

const operatorTypeMapping = { f: 'Фрезер', t: 'Токарь' }

const moment = require('moment')
const { formatNumber } = require('#src/modules/sk_operator/helpers')

function calculateAndFormatPaymentInfo(paymentData) {
    // Вычисляем долю от прибыли
    const partOfProfit = (paymentData.grade * paymentData.work_hours) / 168
    const formattedPartOfProfit = partOfProfit.toFixed(5) // Увеличим точность округления

    // Вычисляем ЗП
    const salary = ((paymentData.vvp * 0.2) / paymentData.part_sum) * partOfProfit
    const formattedSalary = formatNumber(salary.toFixed(5)) // Увеличим точность округления
    const formattedSalaryVAT = formatNumber(
        (salary.toFixed(5) * (1 - 0.13)).toFixed(2),
    ) // Здесь округление до 2 знаков после запятой

    // Формируем строку
    return (
        '<b>Формула:</b>\n' +
        '◉ Доля от прибыли = Грейд * Отработанные часы / 168\n' +
        '◉ До вычета налога = Доля команды / Сумма долей * Доля от прибыли\n' +
        '◉ Ваша чистая прибыль на сегодня = До вычета налога - 13%\n' +
        '\n' +
        '<b>Расчёт:</b>\n' +
        `• Грейд: <b>${paymentData.grade.toFixed(2)}</b>\n` +
        `• Отработанные часы: <b>${formatNumber(paymentData.work_hours)}</b>\n` +
        `• Доля команды: <b>${formatNumber(paymentData.vvp * 0.2)}</b>\n` +
        `• Сумма долей: <b>${paymentData.part_sum.toFixed(2)}</b>\n` +
        `• Доля от прибыли: <b>${formattedPartOfProfit}</b>\n` +
        '• Стандартное количество часов: <b>168</b>\n' +
        '\n' +
        `∙ Доля от прибыли:\n<b>${paymentData.grade.toFixed(2)} * ${formatNumber(paymentData.work_hours)} / 168 = <u>${formattedPartOfProfit}</u></b>\n` +
        `∙ До вычета налога:\n<b>${formatNumber(paymentData.vvp * 0.2)} / ${paymentData.part_sum.toFixed(2)} * ${formattedPartOfProfit} = ${formatNumber(paymentData.payment) || formattedSalary} ₽</b>\n` +
        `∙ Ваша чистая прибыль на сегодня: <b><u>${formatNumber(paymentData.payment * (1 - 0.13)) || formattedSalaryVAT}</u> ₽</b>\n`
    )
}

module.exports = {
    payments: (paymentData) =>
        `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
        `<b>${paymentData.post || ''} ${paymentData.operator_type ? `(${operatorTypeMapping[paymentData.operator_type]})` : ''}</b>\n` +
        `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
        '<blockquote>' +
        `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
        `Грейд: <b>${paymentData.grade.toFixed(2)}</b>\n\n` +
        `Потенциальный рост дохода:\u00A0\u00A0<b>${paymentData.payments_diff.toFixed(2)}</b>\u00A0%\n` +
        `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
        `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\u00A0\u00A0\n` +
        '</blockquote>' +
        `📈 Ваша чистая прибыль на сегодня: <u><b>${formatNumber(paymentData.payment * (1 - 0.13))}</b></u>\u00A0₽\n`,

    paymentsOperator: (paymentData) =>
        `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
        `<b>${paymentData.post || ''} ${paymentData.operator_type ? `(${operatorTypeMapping[paymentData.operator_type]})` : ''}</b>\n` +
        `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
        '<blockquote>' +
        `Рейтинг:  <b>${paymentData.rating_good}\u00A0</b>из<b>\u00A0${paymentData.group_count}\u00A0</b>ЦКП:<b>\u00A0${paymentData.kpi_good}</b>\n` +
        `Рейтинг Качества:  <b>${paymentData.rating_brak}\u00A0</b>из<b>\u00A0${paymentData.group_count}\u00A0</b>Брак:<b>\u00A0${paymentData.kpi_brak}</b>\n` +
        `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
        `Грейд: <b>${paymentData.grade.toFixed(2)}</b>\n\n` +
        `Смена:\u00A0\u00A0<b>${paymentData.smena}</b>\u00A0` +
        `ЦКП:\u00A0\u00A0<b>${formatNumber(paymentData.kpi)}</b>\u00A0` +
        `Рейтинг:\u00A0\u00A0<b>${paymentData.rating_pos}</b>\n` +
        `Отклонение от цели участка ЧПУ:\u00A0\u00A0<b>${paymentData.prod_diff.toFixed(2)}</b>\u00A0%\n\n` +
        `Потенциальный рост дохода:\u00A0\u00A0<b>${paymentData.payments_diff.toFixed(2)}</b>\u00A0%\n` +
        `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
        `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\u00A0\u00A0\n` +
        '</blockquote>' +
        `📈 Ваша чистая прибыль на сегодня: <u><b>${formatNumber(paymentData.payment * (1 - 0.13))}</b></u>\u00A0₽\n`,

    formula: (paymentData) => calculateAndFormatPaymentInfo(paymentData),
}
