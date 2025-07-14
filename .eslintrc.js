module.exports = {
    root: true,
    env: {
        node: true,
        es2020: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        '@typescript-eslint/recommended-requiring-type-checking',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint',
        'prettier'
    ],
    rules: {
        // Prettier integration
        'prettier/prettier': 'error',

        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',

        // General rules
        'no-console': 'off', // Permitido para logging
        'no-debugger': 'error',
        'no-duplicate-imports': 'error',
        'no-unused-expressions': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'prefer-template': 'error',

        // Import/Export rules
        'sort-imports': ['error', {
            ignoreCase: true,
            ignoreDeclarationSort: true,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
        }],

        // Error handling
        'no-throw-literal': 'error',
        'prefer-promise-reject-errors': 'error',

        // Code style
        'max-len': ['error', {
            code: 120,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreComments: true
        }],
        'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
        'complexity': ['warn', 10],

        // Naming conventions
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'interface',
                format: ['PascalCase']
            },
            {
                selector: 'typeAlias',
                format: ['PascalCase']
            },
            {
                selector: 'enum',
                format: ['PascalCase']
            },
            {
                selector: 'class',
                format: ['PascalCase']
            },
            {
                selector: 'variable',
                format: ['camelCase', 'UPPER_CASE'],
                leadingUnderscore: 'allow'
            },
            {
                selector: 'function',
                format: ['camelCase']
            }
        ]
    },
    overrides: [
        {
            // Reglas específicas para archivos de test
            files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                'max-lines-per-function': 'off'
            }
        },
        {
            // Reglas específicas para archivos de configuración
            files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                '@typescript-eslint/no-require-imports': 'off'
            }
        }
    ],
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'coverage/',
        'logs/',
        'downloads/',
        '*.js'
    ]
};