module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
  ],
  'parser': 'vue-eslint-parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'parser': '@typescript-eslint/parser',
    'sourceType': 'module',
  },
  'plugins': [
    'vue',
    '@typescript-eslint',
  ],
  'rules': {
    'comma-dangle': ['error', 'always-multiline'], // 逗號
    'indent': ['error', 2, { 'SwitchCase': 1 }], // 縮排
    'quotes': ['error', 'single'], // 單引號
    'semi': ['error', 'always'], // 分號   
  },
};
