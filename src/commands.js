// commands.js
// Загрузка переменных среды из .env файла
require('dotenv').config()

// Импорт модулей
const { handleRegComment } = require('#src/modules/reg/reg')
const { payments } = require('#src/modules/payments/payments')
const { handleTextCommand } = require('#src/modules/text/text')
const {
  handleHelpCommand,
  handleDocsCommand,
  handleOperatorCommand
} = require('#src/modules/links/docs/docs')
const { oplataNotification } = require('#src/modules/oplata/oplata')
const {
  notifyUsers,
  notifyAllUsers
} = require('#src/modules/sk_operator/notify')
const {
  handleStatusCommand,
  handleMsgCommand
} = require('#src/modules/msg/admin')
const { logNewChatMembers, logLeftChatMember } = require('#src/modules/log/log')
const { handleGetGroupInfoCommand } = require('#src/modules/test/number_users')
const {
  metricsNotificationDirector,
  formatMetricsMessageMaster,
  sendMetricsMessagesNach
} = require('#src/modules/metrics/director/metrics')
const { handlePhoto } = require('#src/modules/test/photo')
const { handleForwardedMessage, whoCommand } = require('#src/modules/test/who')

function setupCommands(bot) {
  bot.use((ctx, next) => {
    if (ctx.message) {
      if (ctx.message.forward_from) {
        handleForwardedMessage(ctx, ctx.message.forward_from.id) // Если сообщение переслано и sender разрешил связывание
        return
      }
      if (ctx.message.forward_sender_name) {
        handleForwardedMessage(ctx, ctx.message.forward_sender_name) // Если сообщение переслано, но sender запретил связывание
        return
      }
    }
    return next() // Если сообщение не переслано или не содержит команды, передаем обработку следующему middleware
  })

  // Обработчик для фото с подписью
  bot.on('photo', (ctx) => handlePhoto(ctx))

  // Обработчики команд
  bot.command(['start', 'reg'], (ctx) =>
    handleRegComment(ctx, (ctx.session.isAwaitFio = true))
  ) // ['start', 'reg']
  bot.command('pay', (ctx) => payments(ctx)) // ['start', 'reg']
  bot.command('new_comment', (ctx) =>
    notifyUsers(ctx, (ctx.session.isUserInitiated = true))
  )
  bot.command('new_comment_all', notifyAllUsers)
  bot.command('help', handleHelpCommand)
  bot.command('oplata', oplataNotification)
  bot.command('msg', handleMsgCommand)
  bot.command('status', (ctx) =>
    handleStatusCommand(ctx, instanceNumber, currentDateTime)
  )
  bot.command('get_group_info', (ctx) => handleGetGroupInfoCommand(ctx))
  bot.command('who', (ctx) => whoCommand(ctx))
  bot.command(['m', 'metrics'], (ctx) => metricsNotificationDirector(ctx, 1))
  bot.command('metrics_director_notification', (ctx) =>
    metricsNotificationDirector(ctx, 0)
  )
  bot.command('metrics_nachalnic_notification', () => sendMetricsMessagesNach())
  bot.command('metrics_master_notification', () => formatMetricsMessageMaster())
  // bot.command('metrics_2', (ctx) => metricsNotificationProiz(ctx, 0))
  // bot.command('metrics_old', metricsNotification)
  bot.command('docs', (ctx) => handleDocsCommand(ctx))
  bot.command('oper', (ctx) => handleOperatorCommand(ctx))

  // bot.command('ping_test', pingService);

  bot.on('message', (ctx) => handleTextCommand(ctx))
  bot.on('text', (ctx) => handleTextCommand(ctx)) // особо не нужна но пусть будет

  // Обработчик текстовых сообщений
  bot.on('new_chat_members', logNewChatMembers)
  bot.on('left_chat_member', logLeftChatMember)
}

module.exports = {
  setupCommands
}
