const security = require("eslint-plugin-security");

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        browser: true,
        es2021: true,
        node: true
      }
    },
    plugins: {
      security: security
    },
    rules: {
      ...security.configs.recommended.rules
    }
  }
];
