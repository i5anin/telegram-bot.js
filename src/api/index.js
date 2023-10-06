const axios = require('axios')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = process.env.WEB_API

async function performRequest(url, method = 'get', data = {}, params = {}) {
    try {
        console.log(`Request: ${method.toUpperCase()} ${url}`, { data, params });  // Log request data
        const response = await axios({ method, url, data, params });
        console.log(`Response from ${url}:`, response.data);  // Log response data
        return response.data;
    } catch (error) {
        console.error(`Error in performing request to ${url}: ${error.message}`);
        console.error(error.response ? error.response.data : error);  // Log error data
    }
}



async function fetchMetrics() {
    try {
        const url = `${WEB_API}/metrics/get.php`
        const params = { key: SECRET_KEY }
        const response = await axios.get(url, { params })
        return response.data.metrics || []
    } catch (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`)
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
        key: WEB_API
    }
    return performRequest(url, 'get', {}, params)
}

async function addUser(userId, cleanedText, username) {
    const params = new URLSearchParams({
        id: userId,
        fio: cleanedText,
        username: username,
        active: 1,
        // key: SECRET_KEY, // раскомментируйте эту строку, когда у вас будет SECRET_KEY
    });

    const url = `${WEB_API}/users/add.php?${params.toString()}`;
    console.log(url)
    return performRequest(url, 'get');
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
    fetchMetrics
}
