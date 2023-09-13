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
            console.log(
                `User ${user.user_id} with name ${user.fio} needs to be promoted.`
            )
        }
    }
}

compareLists().catch((err) => console.error(err))
