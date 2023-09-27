const { getAllPayments, updatePayments } = require('#src/api/index'); // Импортируем функции
const { formatPaymentDate } = require('#src/utils/helpers');

async function oplataNotification() {

    if (!OPLATA_REPORT_ACTIVE) return;

    let i_ADMIN_IDS = null;
    const BATCH_SIZE = 10;

    try {
        const response = await getAllPayments(); // Используем функцию
        stateCounter.oplata_get_all++;

        if (response.data && response.data.payments && response.data.payments.length > 0) {
            let payments = response.data.payments;

            const sortedPayments = payments.sort((a, b) => new Date(b.date) - new Date(a.date));

            let batches = [];
            for (let i = 0; i < sortedPayments.length; i += BATCH_SIZE) {
                batches.push(sortedPayments.slice(i, i + BATCH_SIZE));
            }

            const ADMIN_IDS = [OPLATA_GROUP, DIR_OPLATA];

            for (let batch of batches) {
                let message = '<code>--------------------</code>\n';
                let sentIds = [];

                batch.forEach((payment) => {
                    const formattedSum = Number(payment.sum).toLocaleString('ru-RU');
                    const { formattedDate } = formatPaymentDate(payment);

                    message += `<b>Дата:</b> <code>${formattedDate}</code>\n`;
                    message += `<b>Имя клиента:</b> <code>${payment.client_name}</code>\n`;
                    message += `<b>Сумма:</b> <code>${formattedSum} руб</code>\n`;
                    message += `<b>Информация:</b> <code>${payment.info}</code>\n`;
                    message += '<code>--------------------</code>\n';

                    sentIds.push(payment.id);
                });

                for (const adminId of ADMIN_IDS) {
                    i_ADMIN_IDS = adminId;
                    await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
                }

                if (sentIds.length > 0) {
                    await updatePayments(sentIds); // Используем функцию
                    stateCounter.oplata_get_all++;
                }
            }
        }
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `Попытка отправить сообщение <code>${i_ADMIN_IDS}</code> оплата \n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        );
    }
}

module.exports = { oplataNotification };
