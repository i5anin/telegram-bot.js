require("dotenv").config();
// const axios = require("axios");

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Обработка команды /start
bot.command("start", (ctx) => {
  // Создание inline-клавиатуры
  const inlineMessageKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("1", "1"),
      Markup.button.callback("2", "2"),
      Markup.button.callback("3", "3"),
    ],
    [
      Markup.button.callback("4", "4"),
      Markup.button.callback("5", "5"),
      Markup.button.callback("6", "6"),
    ],
    [
      Markup.button.callback("7", "7"),
      Markup.button.callback("8", "8"),
      Markup.button.callback("9", "9"),
    ],
    [Markup.button.callback("<", "prev"), Markup.button.callback(">", "next")],
  ]);

  // Отправка сообщения с inline-клавиатурой
  ctx.reply("Пожалуйста, выберите дату", inlineMessageKeyboard);
});

// Обработчик кнопок
bot.action(/.+/, async (ctx) => {
  const data = ctx.match[0];
  if (data === "next") {
    ctx.reply("Обработка кнопки next"); // Обработка кнопки "next"
    await ctx.answerCbQuery();
  } else if (data === "prev") {
    ctx.reply("Обработка кнопки prev"); // Обработка кнопки "prev"
    await ctx.answerCbQuery();
  } else {
    ctx.reply(`Вы выбрали ${data}`); // Обработка числовых кнопок
    await ctx.answerCbQuery(`You have selected ${data}`);
  }
});

bot.launch();
