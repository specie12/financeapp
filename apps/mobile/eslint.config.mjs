// @ts-check
import rootConfig from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  ...rootConfig,

  // Ignore declaration files
  {
    ignores: ['**/*.d.ts'],
  },

  // React Native / Expo configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // CommonJS config files (babel.config.js, metro.config.js)
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
      },
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // React Native specific rules
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
