// @ts-check
import rootConfig from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  ...rootConfig,

  // NestJS-specific configuration
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['test/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // NestJS-specific rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Disable consistent-type-imports for NestJS - DI requires actual imports at runtime
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
)
