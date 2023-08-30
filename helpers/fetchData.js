const axios = require('axios')

async function fetchData(url, params) {
    try {
        return (await axios.get(url, { params })).data
    } catch (err) {
        console.error('Server Error', err)
        return null
    }
}

module.exports = fetchData
