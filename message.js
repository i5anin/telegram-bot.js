require('dotenv').config()
const { Telegraf } = require('telegraf');

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

const bot = new Telegraf(BOT_TOKEN);

bot.on('text', (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.message_id;

  if (text.toLowerCase().includes('как дела')) {
    ctx.telegram.sendMessage(chatId, 'Всё отлично, спасибо!', {
      reply_to_message_id: messageId
    });
  } else if (text.toLowerCase().includes('что делаешь')) {
    ctx.telegram.sendMessage(chatId, 'Общаюсь с вами :)', {
      reply_to_message_id: messageId
    });
  } else {
    ctx.telegram.sendMessage(chatId, 'Извините, я вас не понял.', {
      reply_to_message_id: messageId
    });
  }
});

bot.launch();
