import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'views', pattern: 'src/views/**/*' },
        { type: 'widgets', pattern: 'src/widgets/**/*' },
        // feature-auth는 features보다 먼저 선언해야 우선 매칭된다
        { type: 'feature-auth', pattern: 'src/features/auth/**' },
        { type: 'features', pattern: 'src/features/**/*' },
        { type: 'entities', pattern: 'src/entities/**/*' },
        { type: 'shared', pattern: 'src/shared/**/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app',
              allow: ['app', 'views', 'widgets', 'feature-auth', 'features', 'entities', 'shared'],
            },
            { from: 'views', allow: ['widgets', 'feature-auth', 'features', 'entities', 'shared'] },
            { from: 'widgets', allow: ['feature-auth', 'features', 'entities', 'shared'] },
            // features는 auth feature를 cross-cutting 인증 인프라로 취급해 허용
            { from: 'features', allow: ['feature-auth', 'entities', 'shared'] },
            { from: 'feature-auth', allow: ['entities', 'shared'] },
            { from: 'entities', allow: ['entities', 'shared'] },
            { from: 'shared', allow: [] },
          ],
        },
      ],
    },
  },
];
