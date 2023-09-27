const axios = require('axios')
const { format } = require('date-fns')
const { updateBotData } = require('#src/api/index')

function runBot(instanceNumber, currentDateTime) {
    // Объявляем formattedDateTime здесь, чтобы оно было доступно вне блока if
    const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')

    if (MODE === 'build') {
        // Отправка данных при запуске бота
        updateBotData(formattedDateTime, instanceNumber)
            .then(response => {
                console.log('The bot launch data has been successfully logged:', response)
            })
            .catch(error => {
                console.error('Error of registration of bot start data:', error.message)
            })
    }

    // Теперь мы можем использовать formattedDateTime здесь
    console.log(`! Running instance number : ${instanceNumber}\n! Start-up time ${formattedDateTime}`)
    console.log('OPLATA_REPORT_ACTIVE =', OPLATA_REPORT_ACTIVE, '\nMODE =', MODE)

    if (MODE === 'build') {
        bot.telegram.sendMessage(LOG_CHANNEL_ID, emoji.bot + `Запуск бота!\nНомер запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${formattedDateTime}</code>`, { parse_mode: 'HTML' })
    }
}

module.exports = { runBot }