import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import rootConfig from '../../eslint.config.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  { ignores: ['**/*.d.ts'] },
  ...rootConfig,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]
