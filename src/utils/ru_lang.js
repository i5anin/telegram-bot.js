// messages.js
module.exports = {
    alreadyRegistered: '<b>Вы уже зарегистрированы!</b>',
    notRegistered: 'Не зарегистрированы. \nВведите данные в формате:\n<code>Иванов И.И.</code>',
    registrationSuccess: 'Регистрация прошла успешно!',
    registrationError: 'Ошибка регистрации: ',
    serverError: 'Ошибка сервера.',
    invalidData: 'Формат введенных данных неверный.',
    enterData: 'Введите данные в формате <code>Иванов И.И.</code>',
    userFound: (userId, fio, username, fullName) =>
        `<b>Пользователь</b>\n<b>`
        + `ID:</b> <code>${userId}</code>\n`
        + `${username ? `<b>TG:</b> <code>${username}</code> (<code>${fullName}</code>)\n` : ''}`
        + `<b>fio:</b> <code>${fio}</code>`,
    userNotFound: (userId) => `Пользователь\nID: <code>${userId}</code>\n<b>не зарегистрирован в системе</b>`,
    errorAPI: 'Ошибка при получении данных с внешнего API:',
    error: 'Произошла ошибка при выполнении команды',
    formatSKMessage: (det_name, kolvo_brak, controlDescription, defectDescription, comments_otk, specs_nom_id, formattedDate) =>
        `· <b>Название и обозначение:</b>\n<code>${det_name}</code>\n` +
        `· <b>Количество:</b> <code>${kolvo_brak}шт.</code>\n` +
        `· <b>Контроль:</b> <code>${controlDescription}</code>\n` +
        `· <b>Комментарий ОТК:</b> <code>${comments_otk}</code>\n` +
        `· <b>Брак:</b> <code>${defectDescription}</code>\n` +
        `· <b>Партия:</b> <code>${specs_nom_id}</code>\n` +
        `· <b>Дата:</b> <code>${formattedDate}</code>\n\n`,
}
