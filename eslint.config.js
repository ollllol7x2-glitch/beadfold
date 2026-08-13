const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'BEANFOLD_CODEX_PACKAGE_V1 (1)/*'],
  },
]);
