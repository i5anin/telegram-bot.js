const { getAllPayments, updatePayments } = require('#src/api/index') // Импортируем функции
const { formatPaymentDate } = require('#src/utils/helpers')

async function oplataNotification() {

    if (!OPLATA_REPORT_ACTIVE) return

    let i_ADMIN_IDS = null
    const BATCH_SIZE = 10

    try {
        const response = await getAllPayments() // Используем функцию
        console.log(response)
        stateCounter.oplata_get_all++

        if (response && response.payments && response.payments.length > 0) {
            let payments = response.payments
            console.log('Payments received:', payments)

            const sortedPayments = payments.sort((a, b) => new Date(b) - new Date(a))

            let batches = []
            for (let i = 0; i < sortedPayments.length; i += BATCH_SIZE) {
                batches.push(sortedPayments.slice(i, i + BATCH_SIZE))
            }

            const ADMIN_IDS = [DIR_OPLATA, DIR_TEST_GROUP]
            console.log(ADMIN_IDS)

            for (let batch of batches) {
                console.log('Processing batch:', batch)
                let sentIds = []
                let message = '\n'
                batch.forEach((payment) => {
                    const formattedSum = Number(payment.sum).toLocaleString('ru-RU')
                    const { formattedDate } = formatPaymentDate(payment)
                    message += `Дата: <b>${formattedDate}</b>\n`
                    message += `Клиент: <b>${payment.client_name}</b>\n`
                    message += `Сумма: <b>${formattedSum}\u00A0₽</b>\n`
                    message += `<blockquote>Инфо: ${payment.info}</blockquote>\n`
                    message += '\n'
                    sentIds.push(payment.id)
                })

                for (const adminId of ADMIN_IDS) {
                    i_ADMIN_IDS = adminId
                    console.log('Sending message to adminId:', adminId)
                    try {
                        await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
                        console.log('OPLATA Message sent successfully to adminId:', adminId)
                    } catch (error) {
                        console.error('Failed to send message to adminId:', adminId, 'Error:', error)
                        await bot.telegram.sendMessage(
                            LOG_CHANNEL_ID,
                            `Не удалось отправить сообщение <code>${i_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
                            { parse_mode: 'HTML' },
                        )
                    }
                }
                if (sentIds.length > 0) {
                    console.log('Updating payments:', sentIds)
                    await updatePayments(sentIds)
                    stateCounter.oplata_get_all++
                }
            }
        }
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Попытка отправить сообщение <code>${i_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
    }
}

module.exports = { oplataNotification }
