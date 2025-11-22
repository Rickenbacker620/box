import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], plugins: { js }, extends: ['js/recommended'], languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser },
  },
  tseslint.configs.recommended,
  stylistic.configs.recommended,
])
