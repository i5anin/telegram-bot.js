require('dotenv').config()

const { Telegraf } = require('telegraf')
const axios = require('axios')
const { BOT_TOKEN_ORIG } = process.env
const bot = new Telegraf(BOT_TOKEN_ORIG)

const groupId1 = '-1001967174143'

const fetchAdmins = async (groupId) => {
    try {
        const admins = await bot.telegram.getChatAdministrators(groupId)
        return admins
    } catch (error) {
        console.error(
            `Failed to fetch the list of administrators for group ${groupId}: ${error}`
        )
        return []
    }
}

const fetchUsers = async () => {
    try {
        const response = await axios.get(
            'https://bot.pf-forum.ru/api/users/get_all_fio.php'
        )
        return response.data.users_data
    } catch (error) {
        console.error(`Failed to fetch users: ${error}`)
    }
}

const checkIfUserInGroup = async (userId, groupId) => {
    try {
        const member = await bot.telegram.getChatMember(groupId, userId)
        return member.status !== 'left' && member.status !== 'kicked'
    } catch (error) {
        console.error(`Failed to check if user is in group: ${error}`)
        return false
    }
}

const promoteUserToAdmin = async (userId, groupId, fio) => {
    try {
        await bot.telegram.promoteChatMember(groupId, userId, {
            can_manage_chat: true,
            can_post_messages: false,
            can_edit_messages: false,
            can_delete_messages: false,
            can_manage_video_chats: true,
            can_restrict_members: false,
            can_promote_members: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
        })

        // Установите пользовательский титул
        await bot.telegram.setChatAdministratorCustomTitle(groupId, userId, fio)

        console.log(
            `Successfully promoted user ${userId} with label ${fio} to admin.`
        )
    } catch (error) {
        console.error(`Failed to promote user ${userId} to admin: ${error}`)
    }
}

const compareLists = async () => {
    const [adminsGroup1, usersData] = await Promise.all([
        fetchAdmins(groupId1),
        fetchUsers(),
    ])

    const missingInAdmins = usersData.filter((user) => {
        return !adminsGroup1.some(
            (admin) => admin.user.id.toString() === user.user_id.toString()
        )
    })

    for (let user of missingInAdmins) {
        const isInGroup = await checkIfUserInGroup(user.user_id, groupId1)
        if (isInGroup) {
            await promoteUserToAdmin(user.user_id, groupId1, user.fio)
        }
    }
}

compareLists().catch((err) => console.error(err))
