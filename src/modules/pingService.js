// pingService.js

const ping = require('ping')


const hosts = [
    { name: 'Маршрутизатор 1', ip: '192.168.0.2' },
    { name: 'Маршрутизатор 2', ip: '192.168.1.9' },
    { name: 'Сервер 1', ip: '192.168.0.200' },
    { name: 'Устройство хранения данных', ip: '192.168.0.10' },
    { name: 'Устройство хранения данных', ip: '192.168.0.97' },
    { name: 'Устройство хранения данных', ip: '192.168.0.3' },
]

const pingHosts = async (hosts, numOfPings = 4) => {
    let pingResults = ''

    for (let host of hosts) {
        let pings = []
        for (let i = 0; i < numOfPings; i++) {
            const res = await ping.promise.probe(host.ip, { timeout: 2 })
            if (res.alive) pings.push(res.time)
        }

        if (pings.length > 0) {
            const min = Math.min(...pings)
            const max = Math.max(...pings)
            const avg = pings.reduce((a, b) => a + b, 0) / pings.length
            pingResults += `${host.name} (${host.ip})<blockquote>min: ${min}ms, avg: ${avg.toFixed(2)}ms, max: ${max}ms</blockquote>\n`
        } else {
            pingResults += `${host.name} (${host.ip}), все запросы пинга тайм-аут.\n\n`
        }
    }

    return pingResults
}

// Функция, обрабатывающая команду `/ping_test` с проверкой на гранд админа
const pingService = async (ctx) => {
    // Сравнение ID отправителя команды с ID гранд админа
    if (ctx.from.id.toString() === GRAND_ADMIN) {
        ctx.reply('Начинаю тестирование сети, это может занять некоторое время...')
        const results = await pingHosts(hosts)
        ctx.replyWithHTML(`Результаты пинга:\n${results}`)
    } else {
        ctx.reply('Извините, у вас нет прав для выполнения этой команды.')
    }
}

module.exports = { pingService }
