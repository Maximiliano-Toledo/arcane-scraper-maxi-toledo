/** @type {import('jest').Config} */
module.exports = {
    // Preset para TypeScript
    preset: 'ts-jest',

    // Entorno de testing
    testEnvironment: 'node',

    // Directorio raíz del proyecto
    rootDir: './',

    // Directorios donde buscar archivos de test
    testMatch: [
        '<rootDir>/tests/**/*.test.ts',
        '<rootDir>/tests/**/*.spec.ts',
        '<rootDir>/src/**/__tests__/**/*.ts',
        '<rootDir>/src/**/*.test.ts'
    ],

    // Extensiones de archivo a considerar
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Transformaciones
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },

    // Mapeo de módulos (para los path aliases)
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@models/(.*)$': '<rootDir>/src/models/$1',
        '^@constants/(.*)$': '<rootDir>/src/constants/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1'
    },

    // Archivos a ignorar
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/dist/',
        '<rootDir>/downloads/',
        '<rootDir>/logs/'
    ],

    // Directorios a ignorar en la transformación
    transformIgnorePatterns: [
        'node_modules/(?!(playwright)/)'
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

    // Configuración de coverage
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/types/**/*',
        '!src/constants/**/*',
        '!src/index.ts'
    ],

    // Directorios de coverage
    coverageDirectory: 'coverage',

    // Reportes de coverage
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json'
    ],

    // Umbrales de coverage
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Timeout para tests (30 segundos)
    testTimeout: 30000,

    // Configuración adicional
    verbose: true,

    // Variables de entorno para tests
    testEnvironmentOptions: {
        NODE_ENV: 'test'
    },

    // Configuración específica de ts-jest
    globals: {
        'ts-jest': {
            tsconfig: {
                target: 'es2020',
                module: 'commonjs',
                moduleResolution: 'node',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                isolatedModules: true
            }
        }
    },

    // Configuración para mocks
    clearMocks: true,
    restoreMocks: true,

    // Configuración de reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'coverage',
                outputName: 'junit.xml'
            }
        ]
    ]
};