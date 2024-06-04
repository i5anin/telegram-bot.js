const { getAllPayments, updatePayments } = require('#src/api/index') // Импортируем функции
const { formatPaymentDate } = require('#src/utils/helpers')
const axios = require('axios') // Убедитесь, что axios установлен в вашем проекте

async function oplataNotification() {
  if (!OPLATA_REPORT_ACTIVE) return

  let failedAdminId = null
  const BATCH_SIZE = 10

  try {
    const response = await getAllPayments() // Используем функцию
    console.log(response)
    stateCounter.oplata_get_all++

    if (response && response.payments && response.payments.length > 0) {
      let payments = response.payments
      console.log('Payments received:', payments.length)

      const sortedPayments = payments.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )

      let batches = []
      for (let i = 0; i < sortedPayments.length; i += BATCH_SIZE)
        batches.push(sortedPayments.slice(i, i + BATCH_SIZE))

      // Получаем adminUserIds из API
      const adminResponse = await axios.get(WEB_API + '/oplata/get_tg_id.php', {
        params: { key: SECRET_KEY }
      })
      const adminUserIds = adminResponse.data.user_ids || []
      for (let batch of batches) {
        console.log('Processing batch:', batch)
        let sentIds = []
        let message = ''
        batch.forEach((payment, index) => {
          const formattedSum = Number(payment.sum).toLocaleString('ru-RU')
          const { formattedDate } = formatPaymentDate(payment)
          message += `Дата: <b>${formattedDate}</b>\n`
          message += `Клиент: <b><u>${payment.client_name.replace(/ /g, '\u00A0')}</u></b>\n`
          message += `Сумма: <b>${formattedSum}\u00A0₽</b>\n`
          message += `<blockquote>${payment.info}</blockquote>`
          if (index < batch.length - 1) message += '\n\n'

          sentIds.push(payment.id)
        })

        for (const currentAdminId of adminUserIds) {
          failedAdminId = currentAdminId
          console.log('Sending message to adminId:', currentAdminId)
          try {
            await bot.telegram.sendMessage(currentAdminId, message, {
              parse_mode: 'HTML'
            })
            console.log('Message sent successfully to adminId:', currentAdminId)
          } catch (error) {
            console.error(
              'Failed to send message to adminId:',
              currentAdminId,
              'Error:',
              error
            )
            await bot.telegram.sendMessage(
              LOG_CHANNEL_ID,
              `Не удалось отправить сообщение <code>${failedAdminId}</code> оплата \n<code>${error}</code>`,
              { parse_mode: 'HTML' }
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
      `Попытка отправить сообщение <code>${failedAdminId}</code> оплата \n<code>${error}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

module.exports = { oplataNotification }
