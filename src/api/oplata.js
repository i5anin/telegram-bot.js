const axios = require('axios')
const { performRequest } = require('#src/api/shared')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'



// Payments
async function getAllPayments() {
    const url = `${WEB_API}/oplata/get_all.php`
    const params = { key: SECRET_KEY }
    return performRequest(url, 'get', {}, params)
}

async function updatePayments(sentIds) {
    const url = `${WEB_API}/oplata/update.php`
    const params = { key: SECRET_KEY, sent_ids: sentIds.join(',') }
    return performRequest(url, 'get', {}, params)
}

module.exports = {
    getAllPayments,
    updatePayments,
}
