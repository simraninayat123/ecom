// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Files ESLint should never look at.
  { ignores: ['eslint.config.mjs', 'dist/**', 'frontend/**', 'node_modules/**'] },

  // 1. ESLint's recommended JavaScript rules.
  eslint.configs.recommended,

  // 2. TypeScript rules that use type information (e.g. forgotten `await`).
  ...tseslint.configs.recommendedTypeChecked,

  // 3. Report Prettier formatting problems as lint errors.
  eslintPluginPrettierRecommended,

  // 4. Tell ESLint about our environment.
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 5. Project-specific rule adjustments.
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // 6. Test files: Vitest types matchers like expect.objectContaining() as `any`.
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

);


