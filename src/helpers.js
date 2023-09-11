// Функция для выполнения GET-запросов
const axios = require('axios')
const ruLang = require('./ru_lang')

module.exports = async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        if (!response.data) {
            console.log('Сервер ответил без данных. GET-запрос/n') //Сервер ответил без данных
            return null
        }
        return response.data
    } catch (error) {
        console.log(ruLang.serverError, error)//Ошибка сервера
        return null
    }
}