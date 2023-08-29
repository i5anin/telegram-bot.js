require("dotenv").config(); // Эта строка загружает переменные окружения из файла .env

const { Telegraf, Markup } = require("telegraf");

const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

let currentPage = 1;

function generateKeyboard(page) {
  const start = (page - 1) * 9 + 1;
  const end = start + 8;
  const buttons = [];

  for (let i = start; i <= end; i += 3) {
    buttons.push([
      Markup.button.callback(i.toString(), i.toString()),
      Markup.button.callback((i + 1).toString(), (i + 1).toString()),
      Markup.button.callback((i + 2).toString(), (i + 2).toString()),
    ]);
  }

  buttons.push([
    Markup.button.callback("<", "prev"),
    Markup.button.callback(">", "next"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

bot.command("start", (ctx) => {
  currentPage = 1;
  ctx.reply("Пожалуйста, выберите дату", generateKeyboard(currentPage));
});

bot.action(/.+/, async (ctx) => {
  const data = ctx.match[0];

  if (data === "next") {
    currentPage++;
    await ctx.editMessageText(
      `Пожалуйста, выберите дату (Страница ${currentPage})`,
      {
        reply_markup: generateKeyboard(currentPage).reply_markup,
      }
    );
    await ctx.answerCbQuery();
  } else if (data === "prev") {
    if (currentPage > 1) {
      currentPage--;
    }
    await ctx.editMessageText(
      `Пожалуйста, выберите дату (Страница ${currentPage})`,
      {
        reply_markup: generateKeyboard(currentPage).reply_markup,
      }
    );
    await ctx.answerCbQuery();
  } else {
    ctx.reply(`Вы выбрали ${data}`);
    await ctx.answerCbQuery(`You have selected ${data}`);
  }
});

bot.launch();
