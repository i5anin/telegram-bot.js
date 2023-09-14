// cronJobs.js
const cron = require('node-cron')
const { Telegraf } = require('telegraf')
const axios = require('axios')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя

function initCronJobs() {
    // Уведомлять каждые 2 минуты
    cron.schedule('*/2 * * * *', async () => {
        console.log('Running a task every 2 minutes')
        await notifyAllUsers()
    })

    // Уведомлять каждый день в 7:30
    cron.schedule('30 7 * * *', async () => {
        console.log('Running a task at 7:30 every day')
        await morningNotification()
    })
}

async function morningNotification() {
    try {
        const response = await axios.get(`${OPLATA_API}/get.php?key=${SECRET_KEY}`)
        if (response.data && response.data.payments) {
            const payments = response.data.payments
            console.log('Payments received:', payments)

            // Формируем сообщение для администратора
            let message = 'Утренний отчет по оплате:\n'
            payments.forEach((payment) => {
                // Форматирование суммы
                const formattedSum = Number(payment.sum).toLocaleString('ru-RU')

                // Форматирование даты
                const [year, month, day] = payment.date.split('-')
                const formattedDate = `${day}.${month}.${year}`

                message += `Дата: <code>${formattedDate}</code>\n`
                message += `Имя клиента: <code>${payment.client_name}</code>\n`
                message += `Сумма: <code>${formattedSum} руб</code>\n`
                message += `Информация: <code>${payment.info}</code>\n`
                message += '--------------------\n'
            })

            // Отправляем сообщение каждому администратору
            const ADMIN_IDS = [GRAND_ADMIN, LOG_CHANNEL_ID]
            for (const adminId of ADMIN_IDS) {
                await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
            }
        } else {
            console.error('No payments found')
        }
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}


module.exports = { morningNotification, initCronJobs }


