// ESLint flat config. Game modules run in the browser; tests run in Node.
import globals from 'globals';

const SHARED_RULES = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-undef': 'error',
  'no-var': 'error',
  'prefer-const': 'warn',
  'no-implicit-globals': 'error',
  'eqeqeq': ['warn', 'smart'],
};

export default [
  {
    ignores: ['js/vendor/**', 'ui/**', 'node_modules/**', '.github/**'],
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        GameBridge: 'writable',
      },
    },
    rules: SHARED_RULES,
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: SHARED_RULES,
  },
];
