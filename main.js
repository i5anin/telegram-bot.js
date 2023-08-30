const { Telegraf } = require('telegraf')
const config = require('./config')
const fetchData = require('./helpers/fetchData')
const addComment = require('./commands/addComment.js')
const refComment = require('./commands/refComment.js')
const start = require('./commands/start.js')

const bot = new Telegraf(config.BOT_TOKEN)

bot.command('add_comment', addComment)
bot.command('ref_comment', refComment)
bot.command('start', start)

// Остальной код

bot.launch()
