// cronJobs.js
const cron = require('node-cron');
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя

module.exports = function initCronJobs() {
    cron.schedule('*/1 * * * *', async () => {
        console.log('Running a task every 2 minutes');
        await notifyAllUsers();
    });
};


