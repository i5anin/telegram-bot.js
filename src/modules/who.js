const { getAllUsers } = require('#src/api/index')
const msg = require('#src/utils/ru_lang')
const { logMessage } = require('#src/utils/ru_lang')

const handleForwardedMessage = async (ctx) => {
    if (!ctx.message.forward_from) return

    const res = ctx.message
    const userId = res.forward_from.id
    const username = res.forward_from.username
    const firstName = res.forward_from.first_name
    const lastName = res.forward_from.last_name

    try {
        const usersData = await getAllUsers()
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`<b>Пользователь</b>\n` + logMessage(userId, user.fio, username, fullName), { parse_mode: 'HTML' })
        } else {
            await ctx.reply(msg.userNotFound(userId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}


async function whoCommand(ctx) { // /who
    let targetId
    const input = ctx.message.text.split(' ')

    if (input[1]) {
        targetId = parseInt(input[1])
    } else {
        targetId = ctx.from.id // Если ID не предоставлен, используем ID отправителя
    }

    try {
        // Проверяем группу или канал (отрицательный ID)
        if (targetId < 0) {
            const chatInfo = await ctx.getChat(targetId)
            if (chatInfo.type !== 'private') {
                const membersCount = await ctx.getChatMembersCount(targetId)
                const administrators = await ctx.getChatAdministrators(targetId)

                const adminNames = administrators.map(admin =>
                    admin.user.first_name + (admin.user.last_name ? ' ' + admin.user.last_name : '')
                ).join(', ')

                await ctx.reply(`Название группы/канала: ${chatInfo.title}\n` +
                    `Количество участников: ${membersCount}\n` +
                    `Админы: ${adminNames}`)
                return
            } else {
                await ctx.reply("Это приватный чат, информация недоступна.")
                return
            }
        }

        // Проверяем пользователя
        const usersData = await getAllUsers()
        const user = usersData.find(u => u.user_id === targetId)

        if (user) {
            // Если пользователь найден, отправляем информацию о нем
            await ctx.reply(`<b>Пользователь</b>\n` + logMessage(targetId, user.fio), { parse_mode: 'HTML' })
        } else {
            // Если пользователь не найден, отправляем сообщение об ошибке
            await ctx.reply(msg.userNotFound(targetId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}

module.exports = { handleForwardedMessage, whoCommand }