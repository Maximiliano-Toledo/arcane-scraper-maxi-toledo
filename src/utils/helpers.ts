import { ROMAN_VALUES, WORDS_TO_REMOVE, CODE_PATTERNS } from '@/constants';
import {
    isNotNullOrUndefined,
    isNonEmptyString,
    safeArrayAccess,
    safeRegexMatch,
    extractCaptureGroup
} from './types';

/**
 * Convierte números romanos a decimales
 */
export function convertRomanToNumber(roman: string): number {
    let resultado = 0;
    let previo = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
        const char = safeArrayAccess(roman.split(''), i);
        if (!isNonEmptyString(char)) continue;

        const valor = ROMAN_VALUES[char.toUpperCase()];

        if (valor === undefined) {
            throw new Error(`Caracter romano inválido: ${char}`);
        }

        if (valor < previo) {
            resultado -= valor;
        } else {
            resultado += valor;
        }
        previo = valor;
    }

    return resultado;
}

/**
 * Sanitiza nombres de archivo removiendo caracteres especiales
 */
export function sanitizeFileName(nombre: string): string {
    // Limpiar el texto manteniendo el nombre original completo
    let nombreLimpio = nombre
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '_')  // Reemplazar caracteres especiales
        .replace(/\s+/g, '_')                  // Espacios a guiones bajos
        .replace(/_+/g, '_');                  // Múltiples guiones bajos a uno solo

    // Remover palabras de interfaz web pero mantener el nombre del manuscrito
    const palabras = nombreLimpio.split('_').filter(palabra =>
        palabra.length > 1 &&
        !WORDS_TO_REMOVE.includes(palabra.toLowerCase())
    );

    // Si tenemos palabras válidas, usarlas
    if (palabras.length > 0) {
        nombreLimpio = palabras.join('_');
    }

    // Asegurar que no sea demasiado largo
    nombreLimpio = nombreLimpio.substring(0, 60);

    // Remover guiones bajos al inicio y final
    nombreLimpio = nombreLimpio.replace(/^_+|_+$/g, '');

    // Si queda vacío o muy corto, usar un nombre por defecto
    if (!nombreLimpio || nombreLimpio.length < 3) {
        nombreLimpio = `Manuscrito_${Date.now()}`;
    }

    return nombreLimpio;
}

/**
 * Busca códigos en texto usando patrones regex
 */
export function searchCodeInText(texto: string): string | null {
    // Buscar el código con cada patrón
    for (let i = 0; i < CODE_PATTERNS.length; i++) {
        const pattern = safeArrayAccess(CODE_PATTERNS, i);
        if (!pattern) continue;

        const match = safeRegexMatch(texto, pattern);

        if (match && match.length > 0) {
            const primerMatch = match[0];
            if (!isNonEmptyString(primerMatch)) continue;

            // Para patrones de acceso, extraer el código al final
            const codigoMatch = safeRegexMatch(primerMatch, /([A-Z0-9]+)$/);
            const codigo = extractCaptureGroup(codigoMatch, 1);

            if (codigo && codigo.length >= 4) {
                return codigo;
            }

            // Para patrones directos (como KELLS1234), usar el match completo
            if (primerMatch.length >= 4 && /^[A-Z]+[0-9]+$/.test(primerMatch)) {
                return primerMatch;
            }
        }
    }

    return null;
}

/**
 * Extrae texto entre paréntesis del código PostScript
 */
export function extractPostScriptText(content: string): string | null {
    const lineasTj = content.match(/\(([^)]+)\)\s+Tj/g);

    if (!lineasTj || lineasTj.length === 0) {
        return null;
    }

    const textoExtraido = lineasTj.map(linea => {
        const match = linea.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
    }).join(' ');

    return textoExtraido || null;
}

/**
 * Resuelve algoritmo de búsqueda binaria
 */
export function resolveBinarySearchChallenge(vault: string[], targets: number[]): string {
    let contraseña = '';

    for (const target of targets) {
        // Para un array ordenado, la búsqueda binaria es simplemente acceso directo
        if (target >= 0 && target < vault.length) {
            const caracter = vault[target];
            if (caracter) {
                contraseña += caracter;
            }
        }
    }

    return contraseña;
}

/**
 * Valida que un código tenga el formato esperado
 */
export function isValidCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
        return false;
    }

    // Debe tener al menos 4 caracteres
    if (code.length < 4) {
        return false;
    }

    // Debe contener solo letras mayúsculas y números
    if (!/^[A-Z0-9]+$/.test(code)) {
        return false;
    }

    return true;
}

/**
 * Formatea tiempo en milisegundos a formato legible
 */
export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

/**
 * Genera un delay asíncrono
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extrae el título del modal de documentación
 */
export function extractBookTitleFromModal(tituloModal: string): string {
    const match = safeRegexMatch(tituloModal, /Desafío del\s+(.+)/i);
    const titulo = extractCaptureGroup(match, 1);

    if (isNonEmptyString(titulo)) {
        return titulo.trim();
    }

    return tituloModal;
}

/**
 * Verifica si un manuscrito es válido basado en su contenido
 */
export function isValidManuscript(texto: string): boolean {
    if (!texto.includes('Siglo')) {
        return false;
    }

    const validKeywords = [
        'Codex', 'Libro', 'Manuscrito', 'Malleus', 'Necronomicon',
        'Seraphinianus', 'Kells', 'Aureus', 'Descargar', 'Desbloquear',
        'código', 'Ver Documentación', 'purple-600', 'XIV', 'XV', 'XVI',
        'XVII', 'XVIII', 'XIX'
    ];

    return validKeywords.some(keyword => texto.includes(keyword));
}

/**
 * Escapa caracteres especiales para uso en regex
 */
export function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Trunca texto manteniendo palabras completas
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...';
}