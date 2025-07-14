/**
 * Tests para funciones utilitarias
 */

import {
    convertRomanToNumber,
    sanitizeFileName,
    searchCodeInText,
    resolveBinarySearchChallenge,
    isValidCode,
    formatTime,
    extractBookTitleFromModal,
    isValidManuscript
} from '../../src/utils/helpers';

describe('Utilidades Helper', () => {
    describe('convertRomanToNumber', () => {
        test('debe convertir números romanos básicos correctamente', () => {
            expect(convertRomanToNumber('I')).toBe(1);
            expect(convertRomanToNumber('V')).toBe(5);
            expect(convertRomanToNumber('X')).toBe(10);
            expect(convertRomanToNumber('L')).toBe(50);
            expect(convertRomanToNumber('C')).toBe(100);
        });

        test('debe convertir números romanos complejos correctamente', () => {
            expect(convertRomanToNumber('IV')).toBe(4);
            expect(convertRomanToNumber('IX')).toBe(9);
            expect(convertRomanToNumber('XIV')).toBe(14);
            expect(convertRomanToNumber('XV')).toBe(15);
            expect(convertRomanToNumber('XVI')).toBe(16);
            expect(convertRomanToNumber('XIX')).toBe(19);
            expect(convertRomanToNumber('XX')).toBe(20);
        });

        test('debe manejar siglos históricos comunes', () => {
            expect(convertRomanToNumber('XIV')).toBe(14); // Siglo XIV
            expect(convertRomanToNumber('XV')).toBe(15);  // Siglo XV
            expect(convertRomanToNumber('XVI')).toBe(16); // Siglo XVI
            expect(convertRomanToNumber('XVII')).toBe(17); // Siglo XVII
            expect(convertRomanToNumber('XVIII')).toBe(18); // Siglo XVIII
        });

        test('debe lanzar error para caracteres inválidos', () => {
            expect(() => convertRomanToNumber('Z')).toThrow('Caracter romano inválido: Z');
            expect(() => convertRomanToNumber('ABC')).toThrow();
        });

        test('debe ser case insensitive', () => {
            expect(convertRomanToNumber('xiv')).toBe(14);
            expect(convertRomanToNumber('Xiv')).toBe(14);
        });
    });

    describe('sanitizeFileName', () => {
        test('debe limpiar caracteres especiales', () => {
            const input = 'Códex Aureus: Manuscrito@2023!';
            const result = sanitizeFileName(input);
            expect(result).toBe('C_dex_Aureus_Manuscrito_2023_');
        });

        test('debe remover palabras de interfaz web', () => {
            const input = 'filtrar ordenar Codex Kells descarga';
            const result = sanitizeFileName(input);
            expect(result).toBe('Codex_Kells');
        });

        test('debe manejar nombres muy largos', () => {
            const longName = 'a'.repeat(100);
            const result = sanitizeFileName(longName);
            expect(result.length).toBeLessThanOrEqual(60);
        });

        test('debe generar nombre por defecto para entradas vacías', () => {
            expect(sanitizeFileName('')).toMatch(/^Manuscrito_\d+$/);
            expect(sanitizeFileName('   ')).toMatch(/^Manuscrito_\d+$/);
            expect(sanitizeFileName('aa')).toMatch(/^Manuscrito_\d+$/);
        });

        test('debe preservar nombres válidos de manuscritos', () => {
            expect(sanitizeFileName('Book of Kells')).toBe('Book_of_Kells');
            expect(sanitizeFileName('Codex Aureus')).toBe('Codex_Aureus');
        });
    });

    describe('searchCodeInText', () => {
        test('debe encontrar códigos con formato estándar', () => {
            const text = 'Código de acceso: KELLS1234';
            const result = searchCodeInText(text);
            expect(result).toBe('KELLS1234');
            expect(result).toBeValidCode();
        });

        test('debe manejar caracteres especiales en el texto', () => {
            const text = 'Cˆ‡digo de acceso: AUREUS5678';
            const result = searchCodeInText(text);
            expect(result).toBe('AUREUS5678');
        });

        test('debe encontrar códigos con formato legacy', () => {
            const text = 'C[òó]digo de acceso: NECRONOMICON999';
            const result = searchCodeInText(text);
            expect(result).toBe('NECRONOMICON999');
        });

        test('debe retornar null si no encuentra código', () => {
            const text = 'Este texto no contiene ningún código válido';
            const result = searchCodeInText(text);
            expect(result).toBeNull();
        });

        test('debe manejar múltiples patrones', () => {
            const testCases = [
                'access code: TEST1234',
                'código: DEMO5678',
                'acceso: FINAL9999'
            ];

            testCases.forEach(text => {
                const result = searchCodeInText(text);
                expect(result).toBeValidCode();
            });
        });
    });

    describe('resolveBinarySearchChallenge', () => {
        test('debe resolver desafío básico correctamente', () => {
            const vault = ['H', 'E', 'L', 'L', 'O'];
            const targets = [0, 1, 2, 2, 3];
            const result = resolveBinarySearchChallenge(vault, targets);
            expect(result).toBe('HELLO');
        });

        test('debe manejar índices fuera de rango', () => {
            const vault = ['A', 'B', 'C'];
            const targets = [0, 5, 1]; // 5 está fuera de rango
            const result = resolveBinarySearchChallenge(vault, targets);
            expect(result).toBe('AB');
        });

        test('debe retornar string vacío para targets vacíos', () => {
            const vault = ['A', 'B', 'C'];
            const targets: number[] = [];
            const result = resolveBinarySearchChallenge(vault, targets);
            expect(result).toBe('');
        });

        test('debe manejar vault vacío', () => {
            const vault: string[] = [];
            const targets = [0, 1, 2];
            const result = resolveBinarySearchChallenge(vault, targets);
            expect(result).toBe('');
        });
    });

    describe('isValidCode', () => {
        test('debe validar códigos correctos', () => {
            expect(isValidCode('KELLS1234')).toBe(true);
            expect(isValidCode('AUREUS5678')).toBe(true);
            expect(isValidCode('TEST123')).toBe(true);
            expect(isValidCode('ABCD')).toBe(true);
        });

        test('debe rechazar códigos inválidos', () => {
            expect(isValidCode('')).toBe(false);
            expect(isValidCode('abc')).toBe(false); // minúsculas
            expect(isValidCode('TEST@123')).toBe(false); // caracteres especiales
            expect(isValidCode('AB')).toBe(false); // muy corto
            expect(isValidCode('test 123')).toBe(false); // espacios
        });

        test('debe manejar tipos incorrectos', () => {
            expect(isValidCode(null as any)).toBe(false);
            expect(isValidCode(undefined as any)).toBe(false);
            expect(isValidCode(123 as any)).toBe(false);
        });
    });

    describe('formatTime', () => {
        test('debe formatear segundos correctamente', () => {
            expect(formatTime(5000)).toBe('5s');
            expect(formatTime(30000)).toBe('30s');
            expect(formatTime(59000)).toBe('59s');
        });

        test('debe formatear minutos y segundos', () => {
            expect(formatTime(60000)).toBe('1m 0s');
            expect(formatTime(90000)).toBe('1m 30s');
            expect(formatTime(3600000 - 1000)).toBe('59m 59s');
        });

        test('debe formatear horas, minutos y segundos', () => {
            expect(formatTime(3600000)).toBe('1h 0m 0s');
            expect(formatTime(3661000)).toBe('1h 1m 1s');
            expect(formatTime(7323000)).toBe('2h 2m 3s');
        });
    });

    describe('extractBookTitleFromModal', () => {
        test('debe extraer título de formato "Desafío del X"', () => {
            expect(extractBookTitleFromModal('Desafío del Codex Kells')).toBe('Codex Kells');
            expect(extractBookTitleFromModal('Desafío del Libro de Aureus')).toBe('Libro de Aureus');
        });

        test('debe retornar título completo si no coincide el patrón', () => {
            expect(extractBookTitleFromModal('Manuscrito Antiguo')).toBe('Manuscrito Antiguo');
            expect(extractBookTitleFromModal('Libro Misterioso')).toBe('Libro Misterioso');
        });

        test('debe manejar entradas vacías', () => {
            expect(extractBookTitleFromModal('')).toBe('');
            expect(extractBookTitleFromModal('Desafío del')).toBe('');
        });
    });

    describe('isValidManuscript', () => {
        test('debe validar manuscritos con contenido correcto', () => {
            const validTexts = [
                'Codex Aureus Siglo XIV',
                'Libro de Kells Siglo XV Descargar',
                'Manuscrito Siglo XVI código',
                'Malleus Siglo XVII Ver Documentación'
            ];

            validTexts.forEach(text => {
                expect(isValidManuscript(text)).toBe(true);
            });
        });

        test('debe rechazar textos sin "Siglo"', () => {
            const invalidTexts = [
                'Codex Aureus',
                'Libro antiguo',
                'Manuscrito medieval'
            ];

            invalidTexts.forEach(text => {
                expect(isValidManuscript(text)).toBe(false);
            });
        });

        test('debe rechazar textos sin palabras clave válidas', () => {
            const invalidText = 'Texto Siglo XIV sin palabras clave válidas';
            expect(isValidManuscript(invalidText)).toBe(false);
        });
    });
});