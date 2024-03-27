// pingService.js

const ping = require('ping');

const ipList = ['192.168.0.2', '192.168.1.9', '192.168.0.200', '192.168.0.10', '192.168.0.97', '192.168.0.3'];

const pingHosts = async (ipList, numOfPings = 4) => {
    let pingResults = '';

    for (let ip of ipList) {
        let pings = [];
        for (let i = 0; i < numOfPings; i++) {
            const res = await ping.promise.probe(ip, { timeout: 2 });
            if (res.alive) pings.push(res.time);
        }

        if (pings.length > 0) {
            const min = Math.min(...pings);
            const max = Math.max(...pings);
            const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
            pingResults += `IP: ${ip}, min: ${min}ms, avg: ${avg.toFixed(2)}ms, max: ${max}ms\n`;
        } else {
            pingResults += `IP: ${ip}, все запросы пинга тайм-аут.\n`;
        }
    }

    return pingResults;
};

// Функция, обрабатывающая команду `/ping_test`
const pingService = async (ctx) => {
    ctx.reply('Начинаю тестирование сети, это может занять некоторое время...');
    const results = await pingHosts(ipList);
    ctx.reply(`Результаты пинга:\n${results}`);
};

module.exports = { pingService };
