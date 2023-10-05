const axios = require('axios')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = process.env.WEB_API

// Define endpoints
const ENDPOINTS = {
    FETCH_METRICS: 'metrics/get.php',
    CHECK_BOT_DATA: 'bot/check.php',
    UPDATE_BOT_DATA: 'bot/update.php',
    GET_ALL_USERS: 'users/get_all_fio.php',
    CHECK_USER: 'users/check.php',
    ADD_USER: 'users/add.php',
    GET_ALL_COMMENTS: 'comment/get_all.php',
    UPDATE_COMMENT: 'comment/update.php',
    GET_ALL_PAYMENTS: 'oplata/get_all.php',
    UPDATE_PAYMENTS: 'oplata/update.php',
}

// Generic request function
async function request(endpoint, method = 'GET', data = {}, params = {}) {
    const url = `${WEB_API}/${endpoint}`
    try {
        const response = await axios({
            method,
            url,
            data,
            params,
            headers: { 'Authorization': `Bearer ${SECRET_KEY}` },
        })
        return response.data
    } catch (error) {
        console.error(`Error performing ${method} request to ${url}:`, error)
        throw error // Re-throw error for further handling
    }
}

// Function implementations using the generic request function
const api = {
    fetchMetrics: () => request(ENDPOINTS.FETCH_METRICS),

    checkBotData: (formattedDateTime, instanceNumber) =>
        request(ENDPOINTS.CHECK_BOT_DATA, 'GET', {}, { date: formattedDateTime, random_key: instanceNumber }),

    updateBotData: (formattedDateTime, instanceNumber) =>
        request(ENDPOINTS.UPDATE_BOT_DATA, 'GET', {}, { date: formattedDateTime, random_key: instanceNumber }),

    getAllUsers: () => request(ENDPOINTS.GET_ALL_USERS),

    checkUser: (chatId) => request(ENDPOINTS.CHECK_USER, 'GET', {}, { id: chatId }),

    addUser: (userId, cleanedText, username) =>
        request(ENDPOINTS.ADD_USER, 'POST', { id: userId, fio: cleanedText, username, active: 1 }),

    getAllComments: () => request(ENDPOINTS.GET_ALL_COMMENTS, 'GET', {}, { key: SECRET_KEY }),

    updateComment: (taskID, commentText = null) =>
        request(ENDPOINTS.UPDATE_COMMENT, 'GET', {}, {
            id_task: taskID,
            access_key: SECRET_KEY, ...(commentText ? { comments_op: commentText } : { sent: 1 }),
        }),

    getAllPayments: () => {
        const basePath = process.env.NODE_ENV === 'build' ? ENDPOINTS.GET_ALL_PAYMENTS : ENDPOINTS.GET_ALL_PAYMENTS.replace('.php', '_test.php')
        return request(basePath, 'GET', {}, { key: SECRET_KEY })
    },

    updatePayments: (sentIds) => {
        const basePath = process.env.NODE_ENV === 'build' ? ENDPOINTS.UPDATE_PAYMENTS : ENDPOINTS.UPDATE_PAYMENTS.replace('.php', '_test.php')
        return request(basePath, 'GET', {}, { key: SECRET_KEY, sent_ids: sentIds.join(',') })
    },
}

module.exports = api

