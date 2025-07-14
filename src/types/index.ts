/**
 * Tipos principales para el sistema de automatización de manuscritos
 */

export interface AppConfig {
    app: {
        url: string;
        maxPages: number;
        downloadPath: string;
        logPath: string;
    };
    auth: {
        email: string;
        password: string;
    };
    api: {
        baseUrl: string;
        timeout: number;
    };
    browser: {
        headless: boolean;
        viewport: {
            width: number;
            height: number;
        };
        slowMo: number;
    };
}

export enum ManuscriptType {
    UNLOCKED = 'desbloqueado',
    LOCKED = 'bloqueado',
    DOCUMENTATION = 'documentacion'
}

export interface ManuscriptInfo {
    elemento: any; // Playwright element
    titulo: string;
    siglo: string;
    sigloNumerico: number;
    estado: ManuscriptType;
    indice: number;
}

export interface ProcessedManuscript {
    titulo: string;
    siglo: string;
    sigloNumerico: number;
    estado: ManuscriptType;
    codigoExtraido?: string;
    exito: boolean;
    error?: string;
}

export interface PDFExtractionStrategy {
    nombre: string;
    opciones: Record<string, any>;
}

export interface APIChallenge {
    vault: string[];
    targets: number[];
}

export interface APIResponse {
    codigo?: string;
    code?: string;
    challenge?: APIChallenge;
    [key: string]: any;
}

export interface CodeResult {
    manuscrito: string;
    siglo: string;
    codigoExtraido?: string;
    codigoInput?: string;
    codigoObtenido?: string;
}

export interface ExecutionSummary {
    PDFs: CodeResult[];
    APIs: CodeResult[];
    totalCodigos: number;
    manuscritosProcesados: number;
    paginasRecorridas: number;
    tiempoEjecucion: number;
    errores: string[];
}

export interface BrowserOptions {
    headless: boolean;
    slowMo: number;
    viewport: {
        width: number;
        height: number;
    };
}

export interface DownloadResult {
    success: boolean;
    filePath?: string;
    fileSize?: number;
    error?: string;
}

export interface PaginationResult {
    hasNextPage: boolean;
    nextPageButton?: any;
    currentPage: number;
}