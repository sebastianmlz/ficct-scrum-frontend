const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigGoogle = require('eslint-config-google');


module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      eslintConfigGoogle,
      ...angular.configs.tsRecommended,
    ],
    rules: {
      "valid-jsdoc": "off",
      "require-jsdoc": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "linebreak-style": "off",
      "new-cap": [
      "error",
      {
        "capIsNewExceptions": [
          "Component",
          "Input",
          "Output",
          "Directive",
          "Injectable",
          "ViewChild",
          "Pipe",
          "HostListener"
        ],
        "newIsCapExceptions": []
      }
    ]

    },
  },
);
