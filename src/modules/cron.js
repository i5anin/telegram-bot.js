// cronJobs.js
const cron = require('node-cron');
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя

module.exports = function initCronJobs() {
    cron.schedule('*/20 * * * *', async () => {
        // console.log('Running a task every 20 minutes');
        await notifyAllUsers();
    });
};


