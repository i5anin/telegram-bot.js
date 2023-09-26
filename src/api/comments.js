const axios = require('axios')
const { performRequest } = require('#src/api/shared')

const SECRET_KEY = process.env.SECRET_KEY
const WEB_API = 'https://bot.pf-forum.ru/api'



// Comments
async function getAllComments() {
    const url = `${WEB_API}/comment/get_all.php`
    const params = { key: SECRET_KEY }
    return performRequest(url, 'get', {}, params)
}

async function updateComment(id_task) {
    const url = `${WEB_API}/comment/update.php`
    const params = { id_task, sent: 1, access_key: SECRET_KEY }
    return performRequest(url, 'get', {}, params)
}

module.exports = { getAllComments, updateComment }
