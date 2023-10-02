const axios = require('axios')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = process.env.WEB_API

async function performRequest(url, method = 'get', data = {}, params = {}) {
    try {
        const response = await axios({ method, url, data, params })
        return response.data
    } catch (error) {
        console.error(`Error in performing request to ${url}: ${error.message}`)
    }
}

// Bot
async function checkBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/check.php`
    const params = {
        key: SECRET_KEY,
        date: formattedDateTime,
        random_key: instanceNumber,
    }
    return performRequest(url, 'get', {}, params)
}

async function updateBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/update.php`
    const params = {
        key: SECRET_KEY,
        date: formattedDateTime,
        random_key: instanceNumber,
    }
    return performRequest(url, 'get', {}, params)
}

// Users
async function getAllUsers() { // TODO: SECRET_KEY
    const url = `${WEB_API}/users/get_all_fio.php`
    const result = await performRequest(url)
    return result.users_data
}

async function checkUser(chatId) { // TODO: SECRET_KEY
    const url = `${WEB_API}/users/check.php`
    const params = {
        id: chatId,
    }
    return performRequest(url, 'get', {}, params)
}

async function addUser(userId, cleanedText, username) { // TODO: SECRET_KEY
    const url = `${WEB_API}/users/add.php`
    const data = {
        id: userId,
        fio: cleanedText,
        username: username,
        active: 1,
    }
    return performRequest(url, 'post', data)
}

// Comments
async function getAllComments() {
    const url = `${WEB_API}/comment/get_all.php`
    const params = {
        key: SECRET_KEY,
    }
    return performRequest(url, 'get', {}, params)
}

async function updateComment(taskID, commentText = null) {
    const url = `${WEB_API}/comment/update.php`
    const params = {
        id_task: taskID,
        access_key: SECRET_KEY,
        ...(commentText ? { comments_op: commentText } : { sent: 1 }),
    }
    return performRequest(url, 'get', {}, params)
}


// Payments
async function getAllPayments() {
    const basePath = process.env.NODE_ENV === 'build' ? 'get_all.php' : 'get_all_test.php'
    const url = `${WEB_API}/oplata/${basePath}`
    const params = {
        key: SECRET_KEY,
    }
    return performRequest(url, 'get', {}, params)
}

async function updatePayments(sentIds) {
    const basePath = process.env.NODE_ENV === 'build' ? 'update.php' : 'update_test.php'
    const url = `${WEB_API}/oplata/${basePath}`
    const params = {
        key: SECRET_KEY,
        sent_ids: sentIds.join(','),
    }
    return performRequest(url, 'get', {}, params)
}

module.exports = {
    checkBotData,
    updateBotData,
    getAllUsers,
    checkUser,
    addUser,
    getAllComments,
    updateComment,
    getAllPayments,
    updatePayments,
}
