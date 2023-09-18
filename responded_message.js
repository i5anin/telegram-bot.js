require('dotenv').config();
const { Telegraf } = require('telegraf');

const { BOT_TOKEN } = process.env;

const bot = new Telegraf(BOT_TOKEN);

bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  // Если это ответ на сообщение бота
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
    const originalMessageText = ctx.message.reply_to_message.text;
    ctx.reply(`Вы ответили на сообщение бота: "${originalMessageText}" с текстом: "${text}"`);
  } else {
    // Обычная логика бота
    let responseText = 'Извините, я вас не понял.';
    if (text.toLowerCase().includes('как дела')) {
      responseText = 'Всё отлично, спасибо!';
    } else if (text.toLowerCase().includes('что делаешь')) {
      responseText = 'Общаюсь с вами :)';
    }
    await ctx.reply(responseText);
  }
});

// Получение информации о боте для сравнения идентификаторов
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  bot.launch();
});
