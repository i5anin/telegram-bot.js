const axios = require('axios')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'

async function performRequest(url, method = 'get', data = {}, params = {}) {
    try {
        const response = await axios({ method, url, data, params })
        return response.data
    } catch (error) {
        console.error(`Error in performing request to ${url}: ${error.message}`)
    }
}

async function checkAndUpdateBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/check.php`
    stateCounter.bot_check++
    const params = {
        key: SECRET_KEY,
        date: formattedDateTime,
        random_key: instanceNumber,
    }
    const checkResponse = await performRequest(url, 'get', {}, params)
    const updateUrl = `${WEB_API}/bot/update.php`
    stateCounter.bot_update++
    await performRequest(updateUrl, 'get', {}, params)
    return checkResponse
}

async function getAllUsers() {
    const url = `${WEB_API}/users/get_all_fio.php`
    stateCounter.users_get_all_fio++
    return performRequest(url)
}

async function getAndUpdateComments(id_task) {
    const getUrl = `${WEB_API}/comment/get_all.php`
    stateCounter.comment_get_all++
    const getParams = { key: SECRET_KEY }
    const data = await performRequest(getUrl, 'get', {}, getParams)
    const updateUrl = `${WEB_API}/comment/update.php`
    stateCounter.comment_update++
    const updateParams = { id_task, sent: 1, access_key: SECRET_KEY }
    await performRequest(updateUrl, 'get', {}, updateParams)
    return data
}

async function getAndUpdatePayments(sentIds) {
    const getUrl = `${WEB_API}/oplata/get_all.php`
    stateCounter.oplata_get_all++
    const getParams = { key: SECRET_KEY }
    const response = await performRequest(getUrl, 'get', {}, getParams)
    const updateUrl = `${WEB_API}/oplata/update.php`
    stateCounter.oplata_update++
    const updateParams = { key: SECRET_KEY, sent_ids: sentIds.join(',') }
    await performRequest(updateUrl, 'get', {}, updateParams)
    return response
}

async function getUserAndAdd(chatId, userId, cleanedText, username) {
    const getUrl = `${WEB_API}/users/get.php`
    stateCounter.users_get++
    const getParams = { id: chatId }
    const userData = await performRequest(getUrl, 'get', {}, getParams)
    const addUserUrl = `${WEB_API}/users/add.php`
    stateCounter.users_add++
    const addUserParams = {
        id: userId,
        fio: cleanedText,
        username: username,
        active: 1,
    }
    const addUserResponse = await performRequest(addUserUrl, 'post', addUserParams)
    return { userData, addUserResponse }
}

module.exports = {
    checkAndUpdateBotData,
    getAllUsers,
    getAndUpdateComments,
    getAndUpdatePayments,
    getUserAndAdd,
}
