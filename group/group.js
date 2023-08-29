require('dotenv').config()
const { Telegraf } = require('telegraf')

const BOT_TOKEN = process.env.BOT_TOKEN
const LOG_CHAT_ID = process.env.LOG_CHAT_ID // ID вашей лог-группы

const bot = new Telegraf(BOT_TOKEN)

// Команда для получения списка администраторов в чате
bot.command('getAdmins', async (ctx) => {
    try {
        const chatId = ctx.chat.id
        const admins = await ctx.telegram.getChatAdministrators(chatId)
        const adminInfo = admins
            .map((admin) => `${admin.user.first_name} (${admin.user.id})`)
            .join('\n')

        // Отправляем в лог-группу
        ctx.telegram.sendMessage(
            LOG_CHAT_ID,
            `Администраторы чата ${chatId}:\n${adminInfo}`
        )
    } catch (error) {
        console.error(error)
    }
})

// Команда для получения количества участников в чате
bot.command('getMemberCount', async (ctx) => {
    try {
        const chatId = ctx.chat.id
        const count = await ctx.telegram.getChatMembersCount(chatId)

        // Отправляем в лог-группу
        ctx.telegram.sendMessage(
            LOG_CHAT_ID,
            `Количество участников в чате ${chatId}: ${count}`
        )
    } catch (error) {
        console.error(error)
    }
})

// Команда для получения информации о конкретном участнике (например, о себе)
bot.command('getMyInfo', async (ctx) => {
    try {
        const chatId = ctx.chat.id
        const userId = ctx.from.id
        const member = await ctx.telegram.getChatMember(chatId, userId)

        // Отправляем в лог-группу
        const info = `Информация о пользователе ${member.user.first_name} (${member.user.id}) в чате ${chatId}:\nStatus: ${member.status}`
        ctx.telegram.sendMessage(LOG_CHAT_ID, info)
    } catch (error) {
        console.error(error)
    }
})

bot.launch()
