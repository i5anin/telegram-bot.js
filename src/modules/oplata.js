const axios = require('axios')

async function morningNotification() {
    let e_ADMIN_IDS = null
    try {
        const response = await axios.get(`${OPLATA_API}/get_all.php?key=${SECRET_KEY}`)
        if (response.data && response.data.payments) {
            const payments = response.data.payments
            // console.log('Payments received:', payments)

            // Формируем сообщение для администратора
            let message = 'Отчет по оплате:\n'
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
            const ADMIN_IDS = [GRAND_ADMIN, LOG_CHANNEL_ID, '1107003647']
            for (const adminId of ADMIN_IDS) {
                e_ADMIN_IDS = adminId
                await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
            }
        } else {
            console.error('No payments found')
        }
    } catch (error) {
        // console.error('Error fetching data:', error)
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Попытка отправить сообщение <code>${e_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

module.exports = { morningNotification }