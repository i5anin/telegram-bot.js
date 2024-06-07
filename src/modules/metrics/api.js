// api.js
const handleApiError = require('./errorHandler').handleApiError
const axiosInstance = require('./axiosConfig').axiosInstance

const metricsApi = {
  getMetrics: async () => {
    try {
      const response = await axiosInstance.get('/metrics/get.php', {
        params: { key: 'SecretKeyPFForum23' } // Передайте ключ в параметрах запроса
      })
      return response.data.metrics[response.data.metrics.length - 1] // Возвращаем последние данные
    } catch (error) {
      handleApiError(error)
    }
  }
}

// Ничего не экспортируем!
