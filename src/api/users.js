const axios = require('axios')
const { performRequest } = require('#src/api/shared')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'


// Users
async function getAllUsers() {
    const url = `${WEB_API}/users/get_all_fio.php`
    return performRequest(url)
}

async function checkUser(chatId) {
    const url = `${WEB_API}/users/check.php`
    const params = { id: chatId }
    return performRequest(url, 'get', {}, params)
}

async function addUser(userId, cleanedText, username) {
    const url = `${WEB_API}/users/add.php`
    const data = { id: userId, fio: cleanedText, username: username, active: 1 }
    return performRequest(url, 'post', data)
}

module.exports = {
    getAllUsers,
    checkUser,
    addUser,
}
