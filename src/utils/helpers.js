// Функция для выполнения GET-запросов
const { getAllUsers,checkUser } = require('#src/api/index')


// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.isUserInitiated = false
}

function getControlType(char) {
    const controlMapping = {
        'П': 'Пооперационный контроль',
        'У': 'Контроль перед упаковкой',
    }
    return controlMapping[char] || 'N/A'
}

function getDefectType(char) {
    const defectMapping = {
        'О': 'Окончательный',
        'Н': 'Неокончательный',
    }
    return defectMapping[char] || 'N/A'
}

async function getUserLinkById(userId) {
    try {
        const user = await checkUser(userId); // Используйте `await` для ожидания результата
        if (user && user.exists) {
            return `<a href='tg://user?id=${userId}'>${user.fio}</a> <code>${userId}</code>`;
        } else {
            return 'Пользователь не найден.';
        }
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return 'Ошибка при получении данных о пользователе.';
    }
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
        // return user
    } catch (error) {
        console.error('Failed to fetch users data:', error)
    }
}

function formatPaymentDate(payment) {
    const [year, month, day] = payment.date.split('-')
    const formattedDate = `${day}.${month}.${year}`

    return { formattedDate }
}

function formatNumber(number) {
    return parseFloat(number).toLocaleString('ru-RU', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).replace(/,00$/, '')  // Убираем ,00 для целых чисел
}

function formatPercentage(number, maxCharacters) {
    let formattedNumber = formatNumber(number) + '%'  // Добавьте знак процента здесь
    let currentCharacters = formattedNumber.length
    let spacesNeeded = maxCharacters - currentCharacters
    spacesNeeded = Math.max(0, spacesNeeded)  // Убедитесь, что spacesNeeded неотрицательное
    let spaces = ' '.repeat(spacesNeeded)
    return spaces + formattedNumber
}

module.exports = {
    getUserLinkById,
    formatPercentage,
    formatNumber,
    resetFlags,
    formatPaymentDate,
    getDescription,
    getUserName,
    getDefectType,
    getControlType,
}
