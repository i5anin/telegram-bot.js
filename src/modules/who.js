const { getAllUsers } = require('#src/api/index')
const msg = require('#src/utils/ru_lang')

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
            await ctx.reply(msg.userFound(userId,user.fio, username, fullName), { parse_mode: 'HTML' })
        } else {
            await ctx.reply(msg.userNotFound(userId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}


async function whoCommand(ctx) { // /who
    let userId
    let username
    let firstName
    let lastName

    // Инициализация input
    const input = ctx.message.text.split(' ')

    userId = input[1] ? parseInt(input[1]) : ctx.from.id
    username = ctx.from.username
    firstName = ctx.from.first_name
    lastName = ctx.from.last_name

    try {
        const usersDataResponse = await getAllUsers();
        const usersData = usersDataResponse;
        const user = usersData.find(u => u.user_id === userId);

        if (user) {
            // Если пользователь найден, отправляем информацию о нем
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(msg.userFound(userId, user.fio), { parse_mode: 'HTML' })
        } else {
            // Если пользователь не найден, отправляем сообщение об ошибке
            await ctx.reply(msg.userNotFound(userId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}

module.exports = { handleForwardedMessage, whoCommand }