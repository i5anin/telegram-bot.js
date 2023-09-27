// messages.js
module.exports = {
    alreadyRegistered: '<b>Вы уже зарегистрированы!</b>',
    notRegistered: 'Не зарегистрированы. \nВведите данные в формате:\n<code>Иванов И.И.</code>',
    registrationSuccess: 'Регистрация прошла успешно!',
    registrationError: 'Ошибка регистрации: ',
    serverError: 'Ошибка сервера.',
    invalidData: 'Формат введенных данных неверный.',
    enterData: 'Введите данные в формате <code>Иванов И.И.</code>',
    userFound: (userId, username, fullName, fio) => `Пользователь\nID <code>${userId}</code>\nTG: <code>${username || ''}</code> (<code>${fullName}</code>)\nfio: <code>${fio}</code>`,
    userNotFound: (userId) => `Пользователь\nID <code>${userId}</code>\nне зарегистрирован в системе`,
    errorAPI: 'Ошибка при получении данных с внешнего API:',
    error: 'Произошла ошибка при выполнении команды',
    commentAdded: (commentText, detName) => `Комментарий:\n<code>${commentText}</code>\nДля:\n<code>${detName}</code>\nдобавлен успешно.`,
    taskCommentedSuccessfully: (chatId, username, firstName, lastName, commentText) => `${emoji.star.repeat(3)} Успешно прокомментировал задачу\n Пользователь с ID <code>${chatId}</code> @${username}\nИмя: <code>${firstName} ${lastName}</code>\nКомментарий:\n<code>${commentText}</code>`,
    serverErrorOnCommentAdd: 'Ошибка на стороне сервера',
};
