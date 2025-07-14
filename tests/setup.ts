/**
 * Setup global para tests de Jest
 */

import { config } from 'dotenv';

// Cargar variables de entorno para testing
config({ path: '.env.test' });

// Configuración global de timeouts
jest.setTimeout(30000);

// Mock console methods para tests más limpios
const originalConsole = console;

beforeAll(() => {
    // Silenciar logs durante tests a menos que se especifique lo contrario
    if (process.env.JEST_SILENT !== 'false') {
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    }
});

afterAll(() => {
    // Restaurar console
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

// Configuración de variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.HEADLESS = 'true';

// Mock global para fetch si es necesario
global.fetch = jest.fn();

// Utilidades globales para tests
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidCode(): R;
            toBeValidManuscriptTitle(): R;
        }
    }
}

// Custom matchers
expect.extend({
    toBeValidCode(received: string) {
        const isValidCode = /^[A-Z0-9]{4,}$/.test(received);
        return {
            message: () =>
                `expected ${received} ${isValidCode ? 'not ' : ''}to be a valid manuscript code`,
            pass: isValidCode,
        };
    },

    toBeValidManuscriptTitle(received: string) {
        const hasValidContent = received.length > 3 && /[a-zA-Z]/.test(received);
        return {
            message: () =>
                `expected ${received} ${hasValidContent ? 'not ' : ''}to be a valid manuscript title`,
            pass: hasValidContent,
        };
    },
});

// Limpiar mocks después de cada test
afterEach(() => {
    jest.clearAllMocks();
});