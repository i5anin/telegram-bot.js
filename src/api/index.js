import axios from 'axios'

const SECRET_KEY = process.env.SECRET_KEY
const BOT_TOKEN = process.env.BOT_TOKEN
const WEB_API = process.env.WEB_API

async function getMetricsNach() {
  const url = `${WEB_API}/metrics/get_nach.php`
  const params = { key: SECRET_KEY }

  try {
    const response = await axios.get(url, { params })
    console.log(response.data)
    return response.data
  } catch (error) {
    console.error(
      `Ошибка при получении данных из endpoint /metrics/get_nach.php: ${error.message}`
    )
    throw error
  }
}

async function getMetricsMaster() {
  const url = `${WEB_API}/metrics/get_master.php`
  const params = { key: SECRET_KEY }
  try {
    const response = await axios.get(url, { params })
    console.log(response.data)
    return response.data
  } catch (error) {
    console.error(
      `Помилка при отриманні даних з ендпойнта /metrics/get_master.php: ${error.message}`
    )
    throw error
  }
}

const getChatMembersCount = async (chatId) => {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount`,
      {
        params: { chat_id: chatId }
      }
    )
    return response.data.result
  } catch (error) {
    console.error('Ошибка при получении количества участников:', error)
    throw error
  }
}

const getChatAdministrators = async (chatId) => {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatAdministrators`,
      {
        params: { chat_id: chatId }
      }
    )
    return response.data.result
  } catch (error) {
    console.error('Ошибка при получении списка администраторов:', error)
    throw error
  }
}

async function getChatInfo(chatId) {
  try {
    const response = await axios.get(
      'https://api.telegram.org/bot' + BOT_TOKEN + '/getChat',
      {
        params: { chat_id: chatId }
      }
    )
    return response.data.result
  } catch (error) {
    console.error('Ошибка при получении информации о чате', error)
    // Здесь вы можете добавить дополнительную обработку ошибок, если это необходимо
    throw error
  }
}

async function performRequest(url, method = 'get', data = {}, params = {}) {
  try {
    const response = await axios({ method, url, data, params })
    return response.data
  } catch (error) {
    console.error(`Error in performing request to ${url}: ${error.message}`)
  }
}

async function fetchMetrics() {
  const url = `${WEB_API}/metrics/get.php`
  const params = {
    key: SECRET_KEY
  }
  const result = await performRequest(url, 'get', {}, params)
  return result.metrics || []
}

// Bot
async function checkBotData(formattedDateTime, instanceNumber) {
  const url = `${WEB_API}/bot/check.php`
  const params = {
    key: SECRET_KEY,
    date: formattedDateTime,
    random_key: instanceNumber
  }
  return performRequest(url, 'get', {}, params)
}

async function updateBotData(formattedDateTime, instanceNumber) {
  const url = `${WEB_API}/bot/update.php`
  const params = {
    key: SECRET_KEY,
    date: formattedDateTime,
    random_key: instanceNumber
  }
  return performRequest(url, 'get', {}, params)
}

// Users
async function getAllUsers() {
  const url = `${WEB_API}/users/get_all_fio.php`
  const params = { key: SECRET_KEY }
  return performRequest(url, 'get', {}, params)
}

async function checkUser(chatId) {
  const url = `${WEB_API}/users/check.php`
  const params = {
    id: chatId,
    key: SECRET_KEY
  }
  return performRequest(url, 'get', {}, params)
}

async function addUser(userId, cleanedText, username) {
  const url = `${WEB_API}/users/add.php`
  const params = {
    id: userId,
    fio: cleanedText,
    username: username,
    active: 1,
    key: SECRET_KEY
  }
  return performRequest(url, 'get', {}, params)
}

// Comments
async function getAllComments() {
  const url = `${WEB_API}/comment/get_all.php`
  const params = { key: SECRET_KEY }
  return performRequest(url, 'get', {}, params)
}

async function updateComment(taskID, commentText = null) {
  const url = `${WEB_API}/comment/update.php`
  const params = {
    id_task: taskID,
    key: SECRET_KEY,
    ...(commentText ? { comments_op: commentText } : { sent: 1 })
  }
  return performRequest(url, 'get', {}, params)
}

// Payments
async function getAllPayments() {
  const basePath =
    process.env.NODE_ENV === 'build' ? 'get_all.php' : 'get_all_test.php'
  const url = `${WEB_API}/oplata/${basePath}`
  const params = {
    key: SECRET_KEY
  }
  return performRequest(url, 'get', {}, params)
}

async function updatePayments(sentIds) {
  const basePath =
    process.env.NODE_ENV === 'build' ? 'update.php' : 'update_test.php'
  const url = `${WEB_API}/oplata/${basePath}`
  const params = {
    key: SECRET_KEY,
    sent_ids: sentIds.join(',')
  }
  return performRequest(url, 'get', {}, params)
}

async function addPhotoData(user_id, party, comments_otk, location) {
  const url = `${WEB_API}/photo/add.php`
  const params = {
    party,
    user_id,
    comments_otk,
    location,
    key: SECRET_KEY
  }
  return performRequest(url, 'get', {}, params)
}

export {
  checkBotData,
  updateBotData,
  getAllUsers,
  checkUser,
  addUser,
  getAllComments,
  updateComment,
  getAllPayments,
  updatePayments,
  fetchMetrics,
  addPhotoData,
  getChatInfo,
  getChatMembersCount,
  getChatAdministrators,
  getMetricsMaster,
  getMetricsNach
}
