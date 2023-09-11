// cronJobs.js
const cron = require('node-cron');

module.exports = function initCronJobs() {
    cron.schedule('*/20 * * * *', async () => {
        // console.log('Running a task every 20 minutes');
        await notifyAllUsers();
    });
};


