// globals.js
require('dotenv').config()
function setupGloal() {
  global.SECRET_KEY = process.env.SECRET_KEY
  global.WEB_API = process.env.WEB_API

  global.GRAND_ADMIN = process.env.GRAND_ADMIN
  global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID

  global.DIR_OPLATA = process.env.DIR_OPLATA
  global.DIR_METRIC = process.env.DIR_METRIC
  global.KISELEV = process.env.KISELEV

  global.DIR_TEST_GROUP = process.env.DIR_TEST_GROUP
  global.ADMIN_DB = process.env.ADMIN_DB

  global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE // OPLATA_REPORT_ACTIVE = true;
  global.METRICS_REPORT_ACTIVE = process.env.METRICS_REPORT_ACTIVE // METRICS_REPORT_ACTIVE = true;

  global.MODE = process.env.NODE_ENV || 'development' // Если NODE_ENV не определен, по умолчанию используется 'development'
  global.emoji = {
    x: '&#10060;',
    ok: '&#9989;',
    error: '&#10071;',
    warning: '&#x26A0;',
    bot: '&#129302;',
    star: '&#11088;',
    tech: '&#9881;',
    rating_1: '🥇',
    rating_2: '🥈',
    rating_3: '🥉',
    point: '&#183;'
    // point: '&#8226;', // •
    // min_point: '&#183;', // ·
  } // ❌ //✅ //❗ //⚠ //🤖 //⭐ //⚙️ // 🥇 // 🥈 // 🥉 // • // ·

  module.exports = {
    SECRET_KEY,
    WEB_API,
    GRAND_ADMIN,
    LOG_CHANNEL_ID,
    DIR_OPLATA,
    DIR_METRIC,
    KISELEV,
    DIR_TEST_GROUP,
    ADMIN_DB,
    OPLATA_REPORT_ACTIVE,
    METRICS_REPORT_ACTIVE,
    MODE,
    emoji
  }
}

module.exports = {
  setupGloal
}
