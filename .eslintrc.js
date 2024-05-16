module.exports = {
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
    'no-console': 'warn',
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': 'warn',
    'comma-dangle': ['error', 'never'],
    'import/order': 'off'
  }
}
