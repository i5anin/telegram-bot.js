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

async function fetchMetrics() {
    const url = `${WEB_API}/metrics/get.php`;
    const params = {
        key: SECRET_KEY,
    };
    const result = await performRequest(url, 'get', {}, params);
    return result.metrics || [];
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
async function getAllUsers() { // TODO: + key 
    const url = `${WEB_API}/users/get_all_fio.php`
    const params = {
        key: SECRET_KEY,  // Добавлен секретный ключ
    }
    const result = await performRequest(url, 'get', {}, params)
    return result.users_data
}


async function checkUser(chatId) { // TODO: + key
    const url = `${WEB_API}/users/check.php`
    const params = {
        id: chatId,
        key: SECRET_KEY,
    }
    return performRequest(url, 'get', {}, params)
}

async function addUser(userId, cleanedText, username) { // TODO: + key
    const url = `${WEB_API}/users/add.php`
    const params = {
        id: userId,
        // fio: encodeURIComponent(cleanedText),
        fio: cleanedText,
        username: username,
        active: 0,
        // key: SECRET_KEY,
    }
    return performRequest(url, 'get', {}, params)
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
        access_key: SECRET_KEY, // TODO: access_key -> key
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
    fetchMetrics,
}
