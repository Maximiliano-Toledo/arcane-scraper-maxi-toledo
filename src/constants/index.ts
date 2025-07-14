import { PDFExtractionStrategy } from '@/types';

/**
 * Selectores CSS para elementos de la página
 */
export const SELECTORS = {
    LOGIN: {
        EMAIL_INPUT: '#email',
        PASSWORD_INPUT: '#password',
        SUBMIT_BUTTON: 'button:has-text("Acceder")',
        SUCCESS_INDICATOR: 'h1:has-text("Manuscritos Sagrados")'
    },
    MANUSCRIPTS: {
        CONTAINERS: [
            'div.bg-sherpa-surface',
            'div[class*="bg-sherpa-surface"]',
            'div[class*="backdrop-blur-sm"]',
            'div:has(h3)',
            'div:has(button:text("Descargar PDF"))',
            'div:has(input[placeholder*="código"])'
        ],
        TITLE: 'h3',
        DOWNLOAD_BUTTON: 'button:has-text("Descargar PDF")',
        CODE_INPUT: 'input[placeholder*="código"]',
        UNLOCK_BUTTON: 'button:has-text("Desbloquear")',
        DOCUMENTATION_BUTTON: [
            'button:has-text("Ver Documentación")',
            'button[class*="purple-600"]',
            'button.bg-purple-600\\/20'
        ]
    },
    PAGINATION: {
        CONTAINER: 'div.flex.justify-center.gap-1\\.5.pt-6',
        BUTTONS: 'button',
        ACTIVE_CLASSES: ['bg-sherpa-primary', 'text-black']
    },
    MODAL: {
        CONTAINER: 'div.sherpa-card',
        TITLE: 'h3.text-lg.font-semibold.text-sherpa-text',
        COPY_BUTTON: 'button:has-text("📋 Copiar")',
        CLOSE_BUTTON: 'button[aria-label="Cerrar modal"]',
        CONFIRMATION: 'div.sherpa-card:has-text("¡Manuscrito Desbloqueado!")',
        CLOSE_CONFIRMATION: 'div.sherpa-card button:has-text("Cerrar")'
    }
} as const;

/**
 * Patrones de regex para extraer códigos de PDFs
 */
export const CODE_PATTERNS: readonly RegExp[] = [
    /Cˆ‡digo de acceso:\s*([A-Z0-9]+)/gi,
    /C\ˆ\‡digo de acceso:\s*([A-Z0-9]+)/gi,
    /C[ˆ\u02C6][‡\u2021]digo de acceso:\s*([A-Z0-9]+)/gi,
    /C[òóôõöˆ¿][‡†\u2021]digo de acceso:\s*([A-Z0-9]+)/gi,
    /C[^\w\s]{1,4}digo de acceso:\s*([A-Z0-9]+)/gi,
    /C\W{1,4}digo de acceso:\s*([A-Z0-9]+)/gi,
    /Código de acceso:\s*([A-Z0-9]+)/gi,
    /C[oˆó]digo de acceso:\s*([A-Z0-9]+)/gi,
    /codigo de acceso:\s*([A-Z0-9]+)/gi,
    /access code:\s*([A-Z0-9]+)/gi,
    /c[oó]digo:\s*([A-Z0-9]+)/gi,
    /acceso:\s*([A-Z][A-Z0-9]{4,})/gi
] as const;

/**
 * Estrategias de extracción de PDF
 */
export const PDF_EXTRACTION_STRATEGIES: PDFExtractionStrategy[] = [
    { nombre: "normal", opciones: {} },
    { nombre: "tolerante", opciones: { max: 0, version: 'v2.0.550' }},
    { nombre: "legacy", opciones: { normalizeWhitespace: false, disableCombineTextItems: false }},
    { nombre: "super-tolerante", opciones: { max: 0, normalizeWhitespace: true, disableCombineTextItems: true }}
];

/**
 * Valores romanos para conversión
 */
export const ROMAN_VALUES: Record<string, number> = {
    'I': 1,
    'V': 5,
    'X': 10,
    'L': 50,
    'C': 100,
    'D': 500,
    'M': 1000
};

/**
 * Palabras a remover de nombres de archivo
 */
export const WORDS_TO_REMOVE: string[] = [
    'filtrar',
    'ordenar',
    'descarga',
    'sagrados',
    'explora',
    'manuscritos',
    'cripta'
];

/**
 * Configuración de timeouts y reintentos
 */
export const TIMEOUTS = {
    DOWNLOAD: 30000,
    MODAL: 15000,
    UNLOCK: 10000,
    NAVIGATION: 10000,
    API_REQUEST: 15000
} as const;

export const RETRY_CONFIG = {
    MAX_DOWNLOAD_ATTEMPTS: 3,
    MAX_INPUT_ATTEMPTS: 5,
    RETRY_DELAY: 2000
} as const;