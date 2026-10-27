import js from '@eslint/js';

import globals from 'globals';

import importX from 'eslint-plugin-import-x';

import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '.vite/**',
            'vite-env.d.ts',
            'vite.config.ts',
            'eslint.config.ts',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: ['src/**/*.ts'],

        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
            },
        },

        plugins: {
            'import-x': importX,
        },

        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/consistent-type-exports': [
                'error',
                { fixMixedExportsWithInlineTypeSpecifier: true },
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
                { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
                { selector: 'typeLike', format: ['PascalCase'] },
                { selector: 'enumMember', format: ['PascalCase'] },
                { selector: 'objectLiteralProperty', format: null },
                { selector: 'typeProperty', format: null },
            ],
            'no-fallthrough': 'off',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            'import-x/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import-x/no-duplicates': 'error',
            'prefer-const': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            'no-console': 'off',
        },
    }
);