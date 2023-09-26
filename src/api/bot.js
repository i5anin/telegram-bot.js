const axios = require('axios')
const { performRequest } = require('#src/api/shared')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'


// Bot
async function checkBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/check.php`
    const params = { key: SECRET_KEY, date: formattedDateTime, random_key: instanceNumber }
    return performRequest(url, 'get', {}, params)
}

async function updateBotData(formattedDateTime, instanceNumber) {
    const url = `${WEB_API}/bot/update.php`
    const params = { key: SECRET_KEY, date: formattedDateTime, random_key: instanceNumber }
    return performRequest(url, 'get', {}, params)
}

module.exports = {
    checkBotData,
    updateBotData,
}
