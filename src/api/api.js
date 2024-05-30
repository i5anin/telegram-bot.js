const { axiosInstance } = require('#src/api/axiosConfig')
const { handleApiError, handleResponse } = require('#src/api/errorHandler')

async function getPaymentForUser(userId, date) {
  return axiosInstance
    .get('/payments/payments.php', { params: { user_id: userId, date } })
    .then(handleResponse)
    .catch(handleApiError)
}

module.exports = { getPaymentForUser }
