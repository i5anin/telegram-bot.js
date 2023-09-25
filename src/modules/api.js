const axios = require('axios');

const SECRET_KEY = process.env.SECRET_KEY;
const WEB_API = 'https://bot.pf-forum.ru/api';

async function performRequest(url, method = 'get', data = {}, params = {}) {
    try {
        const response = await axios({ method, url, data, params });
        return response.data;
    } catch (error) {
        console.error(`Error in performing request to ${url}: ${error.message}`);
    }
}

async function checkAndUpdateBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/check.php`;
    const params = {
        key: SECRET_KEY,
        date: formattedDateTime,
        random_key: instanceNumber,
    };
    const checkResponse = await performRequest(url, 'get', {}, params);
    const updateUrl = `${WEB_API}/bot/update.php`;
    await performRequest(updateUrl, 'get', {}, params);
    return checkResponse;
}

async function getAllUsers() {
    const url = `${WEB_API}/users/get_all_fio.php`;
    stateCounter.user_get_all++
    return performRequest(url);
}

async function getAndUpdateComments(id_task) {
    const getUrl = `${WEB_API}/comment/get_all.php`;
    const getParams = { key: SECRET_KEY };
    const data = await performRequest(getUrl, 'get', {}, getParams);
    const updateUrl = `${WEB_API}/comment/update.php`;
    const updateParams = { id_task, sent: 1, access_key: SECRET_KEY };
    await performRequest(updateUrl, 'get', {}, updateParams);
    return data;
}

async function getAndUpdatePayments(sentIds) {
    const getUrl = `${WEB_API}/oplata/get_all.php`;
    const getParams = { key: SECRET_KEY };
    const response = await performRequest(getUrl, 'get', {}, getParams);
    const updateUrl = `${WEB_API}/oplata/update.php`;
    const updateParams = { key: SECRET_KEY, sent_ids: sentIds.join(',') };
    await performRequest(updateUrl, 'get', {}, updateParams);
    return response;
}

async function getUserAndAdd(chatId, userId, cleanedText, username) {
    const getUrl = `${WEB_API}/users/get.php`;
    const getParams = { id: chatId };
    const userData = await performRequest(getUrl, 'get', {}, getParams);
    const addUserUrl = `${WEB_API}/users/add.php`;
    const addUserParams = {
        id: userId,
        fio: cleanedText,
        username: username,
        active: 1,
    };
    const addUserResponse = await performRequest(addUserUrl, 'post', addUserParams);
    return { userData, addUserResponse };
}

module.exports = {
    checkAndUpdateBotData,
    getAllUsers,
    getAndUpdateComments,
    getAndUpdatePayments,
    getUserAndAdd,
};
