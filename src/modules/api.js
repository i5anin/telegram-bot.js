const axios = require('axios');



const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'

async function checkAndUpdateBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/check.php?key=${SECRET_KEY}`;
    const updateUrl = `${WEB_API}/bot/update.php?key=${SECRET_KEY}&date=${encodeURIComponent(formattedDateTime)}&random_key=${instanceNumber}`;

    try {
        const checkResponse = await axios.get(url);
        await axios.get(updateUrl);
        return checkResponse.data;
    } catch (error) {
        console.error(`Error in checkAndUpdateBotData: ${error.message}`);
    }
}

async function getAllUsers() {
    const url = `${WEB_API}/users/get_all_fio.php`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error in getAllUsers: ${error.message}`);
    }
}

async function getAndUpdateComments(id_task) {
    const getUrl = `${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`;
    const updateUrl = `${WEB_API}/comment/update.php?id_task=${id_task}&sent=1&access_key=${SECRET_KEY}`;

    try {
        const data = await axios.get(getUrl);
        await axios.get(updateUrl);
        return data.data;
    } catch (error) {
        console.error(`Error in getAndUpdateComments: ${error.message}`);
    }
}

async function getAndUpdatePayments(sentIds) {
    const getUrl = `${WEB_API}/oplata/get_all.php?key=${SECRET_KEY}`;
    const updateUrl = `${WEB_API}/oplata/update.php?key=${SECRET_KEY}&sent_ids=${sentIds.join(',')}`;

    try {
        const response = await axios.get(getUrl);
        await axios.get(updateUrl);
        return response.data;
    } catch (error) {
        console.error(`Error in getAndUpdatePayments: ${error.message}`);
    }
}

async function getUserAndAdd(chatId, userId, cleanedText, username) {
    const getUrl = `${WEB_API}/users/get.php?id=${chatId}`;
    const addUserUrl = `${WEB_API}/users/add.php`;

    try {
        const userData = await axios.get(getUrl);
        const addUserResponse = await axios.post(addUserUrl, {
            id: userId,
            fio: cleanedText,
            username: username,
            active: 1,
        });
        return { userData: userData.data, addUserResponse: addUserResponse.data };
    } catch (error) {
        console.error(`Error in getUserAndAdd for chatId ${chatId}: ${error.message}`);
    }
}

module.exports = {
    checkAndUpdateBotData,
    getAllUsers,
    getAndUpdateComments,
    getAndUpdatePayments,
    getUserAndAdd,
};
