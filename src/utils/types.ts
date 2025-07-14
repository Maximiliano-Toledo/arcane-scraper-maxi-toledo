/**
 * Tipos de utilidad para mejorar la type safety del proyecto
 */

/**
 * Tipo que representa un valor que no puede ser null o undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Tipo helper para manejar errores de manera type-safe
 */
export type ErrorLike = Error | string | unknown;

/**
 * Tipo para validar que un string tenga contenido
 */
export type NonEmptyString<T extends string> = T extends '' ? never : T;

/**
 * Tipo para elementos de array que existen
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Tipo para acceso seguro a propiedades de objeto
 */
export type SafeAccess<T, K extends keyof T> = T[K] extends undefined ? never : T[K];

/**
 * Opciones de timeout seguras para Playwright
 */
export interface SafeWaitOptions {
    timeout?: number;
}

/**
 * Opciones de navegación seguras para Playwright
 */
export interface SafeNavigationOptions {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    timeout?: number;
}

/**
 * Guard para verificar si un valor no es null ni undefined
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

/**
 * Guard para verificar si un string tiene contenido
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.length > 0;
}

/**
 * Guard para verificar si un valor es un Error
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Guard para verificar si un valor es un número válido
 */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Convierte un error desconocido a string de manera segura
 */
export function errorToString(error: ErrorLike): string {
    if (isError(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return String(error);
}

/**
 * Normaliza un timeout para uso con Playwright
 */
export function normalizeTimeout(timeout?: number): SafeWaitOptions {
    if (isValidNumber(timeout) && timeout > 0) {
        return { timeout };
    }
    return {}; // Sin timeout, usar el default
}

/**
 * Crea opciones de wait seguras para Playwright
 */
export function createSafeWaitOptions(timeout?: number): SafeWaitOptions {
    return normalizeTimeout(timeout);
}

/**
 * Crea opciones de navegación seguras para Playwright
 */
export function createSafeNavigationOptions(
    waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' = 'networkidle',
    timeout?: number
): SafeNavigationOptions {
    const options: SafeNavigationOptions = { waitUntil };
    if (isValidNumber(timeout) && timeout > 0) {
        options.timeout = timeout;
    }
    return options;
}

/**
 * Acceso seguro a elementos de array
 */
export function safeArrayAccess<T>(array: readonly T[], index: number): T | undefined {
    if (index < 0 || index >= array.length) {
        return undefined;
    }
    return array[index];
}

/**
 * Acceso seguro a propiedades de objeto - VERSIÓN CORREGIDA
 */
export function safeObjectAccess<T, K extends keyof T>(
    obj: T,
    key: K
): T[K] | undefined {
    if (!obj || typeof obj !== 'object') {
        return undefined;
    }

    // Usar hasOwnProperty en lugar del operador 'in'
    return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}


/**
 * Tipo para RegExp match result que incluye grupos de captura
 */
export interface SafeRegExpMatchArray extends RegExpMatchArray {
    [index: number]: string;
}

/**
 * Función helper para match regex de manera type-safe
 */
export function safeRegexMatch(
    text: string,
    pattern: RegExp
): SafeRegExpMatchArray | null {
    const match = text.match(pattern);
    return match as SafeRegExpMatchArray | null;
}

/**
 * Extrae un grupo de captura de manera segura
 */
export function extractCaptureGroup(
    match: RegExpMatchArray | null,
    groupIndex: number
): string | null {
    if (!match || groupIndex >= match.length) {
        return null;
    }
    const group = match[groupIndex];
    return isNonEmptyString(group) ? group : null;
}