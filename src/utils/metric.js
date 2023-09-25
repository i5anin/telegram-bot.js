const io = require('@pm2/io')

io.init({
    transactions: true, // включить отслеживание транзакций
    http: true, // включить метрики веб-сервера (необязательно)
})


function createMetric(name, counterObject, key) {
    return io.metric({
        name: name,
        value: function() {
            return counterObject[key]
        },
    })
}

createMetric('user_get_all', stateCounter.user_get_all, 'stateCounter')
// createMetric('Message Event', state, 'messageCounter')
// createMetric('Cron Message Event', state, 'cronMessageCounter')