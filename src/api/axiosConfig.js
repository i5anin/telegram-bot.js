const axios = require('axios')

// Предположим, что WEB_API уже определено в ваших переменных окружения
const baseURL = process.env.WEB_API

// Создаем экземпляр Axios с базовым URL
const axiosInstance = axios.create({ baseURL })

// Экспортируем экземпляр Axios
module.exports = { axiosInstance }
