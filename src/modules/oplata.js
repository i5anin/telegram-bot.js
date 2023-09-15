const axios = require('axios')

async function morningNotification() {
    let e_ADMIN_IDS = null
    const BATCH_SIZE = 10

    try {
        const response = await axios.get(`${OPLATA_API}/get_all.php?key=${SECRET_KEY}`)
        if (response.data && response.data.payments && response.data.payments.length > 0) {
            const payments = response.data.payments

            // Разбиваем массив платежей на подмассивы размером BATCH_SIZE
            let batches = []
            for (let i = 0; i < payments.length; i += BATCH_SIZE) {
                batches.push(payments.slice(i, i + BATCH_SIZE))
            }

            const ADMIN_IDS = [
                GRAND_ADMIN,
                LOG_CHANNEL_ID,
                '1107003647',
            ]

            for (let batch of batches) {
                // Формируем сообщение для администратора
                let message = 'Отчет по оплате:\n'
                let sentIds = []

                batch.forEach((payment) => {
                    const formattedSum = Number(payment.sum).toLocaleString('ru-RU')
                    const [year, month, day] = payment.date.split('-')
                    const formattedDate = `${day}.${month}.${year}`

                    message += `Дата: <code>${formattedDate}</code>\n`
                    message += `Имя клиента: <code>${payment.client_name}</code>\n`
                    message += `Сумма: <code>${formattedSum} руб</code>\n`
                    message += `Информация: <code>${payment.info}</code>\n`
                    message += '--------------------\n'

                    sentIds.push(payment.id)
                })

                // Отправляем сообщение каждому администратору
                for (const adminId of ADMIN_IDS) {
                    e_ADMIN_IDS = adminId
                    await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
                }

                // Если сообщения успешно отправлены, обновляем статус на сервере
                if (sentIds.length > 0) {
                    await axios.get(`${OPLATA_API}/update.php?key=${SECRET_KEY}&sent_ids=${sentIds.join(',')}`)
                }
            }
        } else {
            console.log('No payments found, skipping notification.')
        }
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Попытка отправить сообщение <code>${e_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

module.exports = { morningNotification }
