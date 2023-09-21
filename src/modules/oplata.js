const axios = require('axios')

async function oplataNotification() {

    let e_ADMIN_IDS = null
    const BATCH_SIZE = 10

    try {
        const response = await axios.get(`${WEB_API}/oplata/get_all.php?key=${SECRET_KEY}`)
        if (response.data && response.data.payments && response.data.payments.length > 0) {
            let payments = response.data.payments

            // Сортируем платежи по дате в порядке убывания
            const sortedPayments = payments.sort((a, b) => new Date(b.date) - new Date(a.date))

            // Разбиваем массив платежей на подмассивы размером BATCH_SIZE
            let batches = []
            for (let i = 0; i < sortedPayments.length; i += BATCH_SIZE) {
                batches.push(sortedPayments.slice(i, i + BATCH_SIZE))
            }

            const ADMIN_IDS = [OPLATA_GROUP, DIR_OPLATA]

            for (let batch of batches) {
                // Формируем сообщение для администратора
                let message = 'Отчет по оплате:\n--------------------\n'
                let sentIds = []

                batch.forEach((payment) => {
                    const formattedSum = Number(payment.sum).toLocaleString('ru-RU')
                    const [year, month, day] = payment.date.split('-')
                    const formattedDate = `${day}.${month}.${year}`

                    message += `<b>Дата:</b> <code>${formattedDate}</code>\n`
                    message += `<b>Имя клиента:</b> <code>${payment.client_name}</code>\n`
                    message += `<b>Сумма:</b> <code>${formattedSum} руб</code>\n`
                    message += `<b>Информация:</b> <code>${payment.info}</code>\n`
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
                    await axios.get(`${WEB_API}/oplata/update.php?key=${SECRET_KEY}&sent_ids=${sentIds.join(',')}`)
                }
            }
        } else {
            // console.log('- Оплата не найдена, пропуск уведомления.')
        }
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Попытка отправить сообщение <code>${e_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

module.exports = { oplataNotification }
