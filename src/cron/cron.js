const { initMasterCron } = require('#src/cron/metrics/cron_master')
const { initNachCron } = require('#src/cron/metrics/cron_nach')
const { initDirectorCron } = require('#src/cron/metrics/cron_director')
const { initBotCron } = require('#src/cron/cron_start_bot')
const { initSkCommentsCron } = require('#src/cron/sk_comments')
const { initOplataCron } = require('#src/cron/cron_opalta') // импортируйте функцию format

function initCronJobs(currentDateTime, instanceNumber) {

    initSkCommentsCron()
    initOplataCron()

    if (!METRICS_REPORT_ACTIVE) {
        return
    } else {
        initDirectorCron()
        initNachCron()
        initMasterCron()
    }
    initBotCron(currentDateTime, instanceNumber)
}

module.exports = { initCronJobs }
