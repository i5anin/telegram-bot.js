module.exports = {
  globals: {
    stateCounter: 'writable'
  },
  env: {
    browser: true,
    es2021: true
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'never'], // Указываем, что точки с запятой не нужны
    'no-console': 'warn',
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': 'warn',
    'comma-dangle': ['error', 'never'],
    'import/order': 'off',
    quotes: ['error', 'single'] // Указываем, что предпочитаем одинарные кавычки
  }
}
