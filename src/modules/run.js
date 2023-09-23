const axios = require('axios')

function runBot(instanceNumber,currentDateTime){
    if (MODE === 'build') {
        const formattedDateTime = `${currentDateTime.getFullYear()}-${String(currentDateTime.getMonth() + 1).padStart(2, '0')}-${String(currentDateTime.getDate()).padStart(2, '0')} ${String(currentDateTime.getHours()).padStart(2, '0')}:${String(currentDateTime.getMinutes()).padStart(2, '0')}:${String(currentDateTime.getSeconds()).padStart(2, '0')}`
// URL для регулярного обновления данных о боте
        const updateBotURL = `${WEB_API}/bot/update.php?key=${SECRET_KEY}&date=${encodeURIComponent(formattedDateTime)}&random_key=${instanceNumber}`

// Отправка данных при запуске бота
        axios.get(updateBotURL)
            .then(response => {
                console.log('Данные о запуске бота успешно зарегистрированы:', response.data)
            })
            .catch(error => {
                console.error('Ошибка регистрации стартовых данных бота:', error)
            })
    }

    console.log(`! Номер запущенного экземпляра : ${instanceNumber} Время запуска [${currentDateTime}]`)
    console.log('OPLATA_REPORT_ACTIVE =', OPLATA_REPORT_ACTIVE)
    console.log('MODE =', MODE)

    if (MODE === 'build') bot.telegram.sendMessage(LOG_CHANNEL_ID, emoji.bot + `Запуск бота!\nНомер запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${currentDateTime}</code>`, { parse_mode: 'HTML' })

}

module.exports = {runBot}