const { getAllPayments, updatePayments } = require('#src/api/index') // Импортируем функции
const { formatPaymentDate } = require('#src/utils/helpers')
const axios = require('axios') // Убедитесь, что axios установлен в вашем проекте

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

            // Получаем ADMIN_IDS из API
            const adminResponse = await axios.get(WEB_API + '/oplata/get_tg_id.php', {
                params: { key: SECRET_KEY },
            })
            const ADMIN_IDS = adminResponse.data.user_ids || []
            for (let batch of batches) {
                console.log('Processing batch:', batch)
                let sentIds = []
                let messages = [] // Используем массив для хранения отдельных сообщений о платежах

                batch.forEach((payment) => {
                    const formattedSum = Number(payment.sum).toLocaleString('ru-RU')
                    const { formattedDate } = formatPaymentDate(payment)
                    let message = '' // Строим сообщение для каждого платежа отдельно
                    message += `Дата: <b>${formattedDate}</b>\n`
                    message += `Клиент: <b>${payment.client_name.replace(/ /g, '\u00A0')}</b>\n`;
                    message += `Сумма: <b>${formattedSum}\u00A0₽</b>\n`
                    message += `<blockquote>${payment.info}</blockquote>` // Убираем лишний \n в конце
                    messages.push(message) // Добавляем сформированное сообщение в массив
                    sentIds.push(payment.id)
                })

                // Соединяем все сообщения в одно, добавляя между ними разделитель
                let finalMessage = messages.join('\n\n') // Добавляем двойной перенос строки только между сообщениями о платежах

                for (const adminId of ADMIN_IDS) {
                    i_ADMIN_IDS = adminId
                    console.log('Sending message to adminId:', adminId)
                    try {
                        await bot.telegram.sendMessage(adminId, finalMessage, { parse_mode: 'HTML' })
                        console.log('Message sent successfully to adminId:', adminId)
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
