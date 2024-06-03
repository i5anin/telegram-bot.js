// Функция для разбивки массива на части
const { Markup } = require('telegraf')
const { BOT_TOKEN } = process.env

function chunkArray(array, chunkSize) {
  const result = []
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}

async function checkingGroup(ctx) {
  fetch(`${WEB_API}/users/find_list.php?search_term=ЧПУ`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        // Обработка результатов поиска
        const users = data.data
        if (users.length === 0) {
          ctx.reply('Пользователей не найдено.')
        } else {
          // Разбиваем пользователей на группы по 50
          const chunks = chunkArray(users, 50)

          // Отправляем сообщения с пользователями
          let currentChunkIndex = 0
          let counterOTK = 1
          let counterEM = 1

          function processChunk() {
            if (currentChunkIndex < chunks.length) {
              const chunk = chunks[currentChunkIndex]
              currentChunkIndex++

              chunk.forEach((user, userIndex) => {
                // Проверка наличия в группах
                Promise.all([
                  // Запрос к API Telegram для группы ОТК
                  fetch(
                    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=-1002011411761&user_id=${user.user_id}`
                  ),
                  // Запрос к API Telegram для группы Электронная маршрутка
                  fetch(
                    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=-1001967174143&user_id=${user.user_id}`
                  )
                ])
                  .then(([otkResponse, emResponse]) => {
                    // Парсим ответы от API Telegram
                    return Promise.all([otkResponse.json(), emResponse.json()])
                  })
                  .then(([otkData, emData]) => {
                    // Проверяем, есть ли пользователь в группах
                    const isInGroupOTK =
                      otkData.result &&
                      (otkData.result.status === 'member' ||
                        otkData.result.status === 'administrator')
                    const isInGroupEM =
                      emData.result &&
                      (emData.result.status === 'member' ||
                        emData.result.status === 'administrator')

                    // Создаем массив кнопок для пользователя
                    const userButtons = []

                    if (!isInGroupOTK) {
                      userButtons.push(
                        Markup.button.url(
                          'ОТК',
                          'https://t.me/+G5Cg3nagVyc0Yzcy'
                        )
                      )
                    }

                    if (!isInGroupEM) {
                      userButtons.push(
                        Markup.button.url(
                          'Маршрутка',
                          'https://t.me/+lPaHwdU2ILMzNTdi'
                        )
                      )
                    }

                    // Отправляем сообщение пользователю с кнопками
                    if (userButtons.length > 0) {
                      ctx.telegram.sendMessage(
                        user.user_id,
                        'Здравствуйте! Вы не состоите в следующих группах:',
                        Markup.inlineKeyboard(userButtons)
                      )
                    }
                  })
                  .catch((error) => {
                    console.error(
                      'Ошибка получения данных о членстве в группе:',
                      error
                    )
                    if (error.response && error.response.error_code === 400) {
                      //  Ошибка 400 - пользователь не найден в группе
                      ctx.reply(`Пользователь ${user.fio} не найден в группе.`)
                    } else {
                      ctx.reply(
                        `Ошибка получения данных о членстве в группе для ${user.fio}`
                      )
                    }
                  })
              })
              // Задержка 3 секунды перед обработкой следующего чанка
              if (currentChunkIndex < chunks.length) {
                setTimeout(processChunk, 3000)
              } else {
                // Все чанки обработаны
                console.log('Все пользователи проверены!')
              }
            }
          }

          processChunk() // Начинаем обработку с первого чанка
        }
      } else {
        ctx.reply('Ошибка поиска.')
      }
    })
    .catch((error) => {
      console.error('Ошибка запроса:', error)
      ctx.reply('Произошла ошибка. Попробуйте позже.')
    })
}

module.exports = { checkingGroup }
