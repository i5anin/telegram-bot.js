// messages.js
module.exports = {
    alreadyRegistered: '<b>Вы уже зарегистрированы!</b>',
    notRegistered: 'Не зарегистрированы. \nВведите данные в формате:\n<pre>Иванов И.И.</pre>',
    registrationSuccess: 'Регистрация прошла успешно!',
    registrationError: 'Ошибка регистрации: ',
    serverError: 'Ошибка сервера.',
    invalidData: 'Формат введенных данных неверный.',
    enterData: 'Введите данные в формате <pre>Иванов И.И.</pre>',
    userFound: (userId, username, fullName, fio) => `Пользователь\nID <code>${userId}</code>\nTG: ${'@' + username || ''} (<pre>${fullName}</pre>)\nfio: <pre>${fio}</pre>`,
    userNotFound: (userId) => `Пользователь\nID <code>${userId}</code>\nне зарегистрирован в системе`,
    errorAPI: 'Ошибка при получении данных с внешнего API:',
    error: 'Произошла ошибка при выполнении команды',
}
