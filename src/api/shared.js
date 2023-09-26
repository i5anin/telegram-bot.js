// Функция для выполнения GET-запросов
const axios = require('axios')

async function performRequest(url, method = 'get', data = {}, params = {}) {
    try {
        const response = await axios({ method, url, data, params })
        return response.data
    } catch (error) {
        console.error(`Error in performing request to ${url}: ${error.message}`)
    }
}

module.exports = { performRequest }
