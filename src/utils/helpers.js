// Функция для выполнения GET-запросов
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')
const { getAllUsers } = require('#src/api/index')


// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.isUserInitiated = false
}

function getDescription(code) {
    const typeMapping = {
        'ПО': 'Пооперационный контроль окончательный',
        'ПН': 'Пооперационный контроль неокончательный',
        'УО': 'Контроль перед упаковкой окончательный',
        'УН': 'Контроль перед упаковкой неокончательный',
    }
    return typeMapping[code] || 'Неизвестный код'
}

async function getUserName(userId) {
    try {
        let usersData = await getAllUsers() || []
        const user = usersData.find(u => u.user_id === userId)
        return user ? user.fio : '<code>Неизвестный пользователь</code>'
        return user
    } catch (error) {
        console.error('Failed to fetch users data:', error)
    }
}

function formatPaymentDate(payment) {
    const [year, month, day] = payment.date.split('-')
    const formattedDate = `${day}.${month}.${year}`

    return { formattedDate }
}

module.exports = { resetFlags, formatPaymentDate, getDescription, getUserName }
