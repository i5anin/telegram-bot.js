//dir

const cron = require('node-cron')
const { metricsNotificationDirector } = require('#src/modules/metrics/director/metrics')

// Храним расписание для отправки метрик
const metricsSchedules = {}

async function fetchMetricsData() {
    try {
        const response = await get(`${WEB_API}/metrics/get_metrica_time.php`)
        return response.data
    } catch (error) {
        console.error('Ошибка при получении данных о метриках:', error)
        return [] // Возвращаем пустой массив в случае ошибки
    }
}

async function cronMetricsSchedules() {
    try {
        const metricsData = await fetchMetricsData()
        if (metricsData.length > 0) {
            metricsData.forEach(metric => {
                const { user_id, metrica_time_h, metrica_time_m } = metric
                const schedule = `${metrica_time_m} ${metrica_time_h} * * *`

                // Проверяем, есть ли пользователь в массиве
                if (metricsSchedules[user_id]) {
                    // Устанавливаем задание для отправки метрик по расписанию
                    cron.schedule(schedule, async () => {
                        console.log(`Running metricsNotificationDirector() for user ${user_id} at ${schedule}`)
                        await metricsNotificationDirector(null, 0, user_id)
                    })
                } else {
                    console.warn(`Пользователь ${user_id} не найден в metricsSchedules.`)
                }

                // Обновляем расписание в metricsSchedules
                metricsSchedules[user_id] = schedule
            })
        } else {
            console.warn('metricsData is empty. Skipping update of metricsSchedules.')
        }
    } catch (error) {
        console.error('Ошибка при получении данных о метриках:', error)
    }
}

// Запускаем задачу кому что отправлять каждые 10 секунд для обновления данных о метриках
cron.schedule('*/10 * * * * *', async () => {
    console.log('Обновление данных о метриках каждые 10 секунд')
    await fetchMetricsData()
})

module.exports = { cronMetricsSchedules }