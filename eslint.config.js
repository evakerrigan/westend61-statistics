import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config([
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'src/vite-env.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // ---------------------------------------------------------------------------
  // Bulletproof-react: unidirectional architecture boundaries.
  // Allowed import flow:  shared layers  ->  features  ->  app
  // (Mirrors bulletproof-react's `import/no-restricted-paths`; implemented with
  //  the built-in `no-restricted-imports` rule to stay compatible with the flat
  //  config and ESLint 10, which `eslint-plugin-import` does not yet support.)
  // ---------------------------------------------------------------------------

  // Shared layers must not import from the `features` or `app` layers.
  {
    files: [
      'src/components/**',
      'src/hooks/**',
      'src/lib/**',
      'src/stores/**',
      'src/types/**',
      'src/utils/**',
      'src/config/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**'],
              message:
                'Shared modules must not import from features (unidirectional architecture: shared -> features -> app).',
            },
            {
              group: ['@/app', '@/app/**'],
              message:
                'Shared modules must not import from app (unidirectional architecture: shared -> features -> app).',
            },
          ],
        },
      ],
    },
  },

  // Feature layers must not import from the `app` layer.
  // To also forbid cross-feature imports (compose features only in the app
  // layer), uncomment the second pattern once you have features.
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**'],
              message:
                'Features must not import from app (unidirectional architecture: shared -> features -> app).',
            },
            // {
            //   group: ['@/features/*/**'],
            //   message:
            //     'Do not import across features; compose them in the app layer and use relative imports within a feature.',
            // },
          ],
        },
      ],
    },
  },
]);
