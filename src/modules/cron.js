// cronJobs.js
const axios = require('axios')
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/15 * * * *', async (ctx) => {
        console.log('notifyAllUsers Running a task every 15 minutes');
        await notifyAllUsers(ctx)
    })

    // !!! Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        // console.log('Оплата. oplataNotification Running a task every 6 minutes');
        await oplataNotification()
    })

    const checkAndUpdateBotData = `${WEB_API}/bot/start.php?key=${SECRET_KEY}`;
    cron.schedule('*/10 * * * *', () => {  // Каждые 10 минут
        axios.get(checkAndUpdateBotData)
            .then(response => {
                if (response.data && response.data.latest_entry) {
                    const latestEntry = response.data.latest_entry;

                    // Проверка date и random_key
                    if (latestEntry.date !== formattedDateTime || latestEntry.random_key !== instanceNumber) {
                        // Отправка сообщения в LOG_CHANNEL_ID
                        bot.telegram.sendMessage(LOG_CHANNEL_ID, `Mismatch detected!\nExpected date: ${formattedDateTime}\nReceived date: ${latestEntry.date}\nExpected random_key: ${instanceNumber}\nReceived random_key: ${latestEntry.random_key}`, { parse_mode: 'HTML' })

                        // Завершение работы бота
                        bot.stop('Mismatch detected! Stopping the bot.');
                    } else {
                        console.log('Bot data is consistent:', response.data);
                    }

                } else {
                    console.error('Unexpected data format from server:', response.data);
                }
            })
            .catch(error => {
                console.error('Error checking bot data:', error);
            });
    });
}

module.exports = { initCronJobs }


