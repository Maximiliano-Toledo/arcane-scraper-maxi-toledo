import { Download } from 'playwright';
import { existsSync, statSync, ensureDirSync } from 'fs-extra';
import path from 'path';
import { BrowserService } from './browser.service';
import { appConfig } from '@/config/app.config';
import { DownloadResult } from '@/types';
import { RETRY_CONFIG, TIMEOUTS } from '@/constants';
import { delay } from '@/utils/helpers';
import { adventureLogger } from '@/utils/logger';

export class DownloadService {
    private downloadPath: string;

    constructor(private browserService: BrowserService) {
        this.downloadPath = appConfig.app.downloadPath;
        this.ensureDownloadDirectory();
    }

    /**
     * Asegura que el directorio de descargas existe
     */
    private ensureDownloadDirectory(): void {
        try {
            ensureDirSync(this.downloadPath);
            adventureLogger.debug(`Directorio de descargas asegurado: ${this.downloadPath}`);
        } catch (error) {
            adventureLogger.error('Error creando directorio de descargas', error);
            throw error;
        }
    }

    /**
     * Descarga un archivo con reintentos automáticos - OPTIMIZADO
     */
    async downloadWithRetries(
        download: Download,
        fileName: string,
        maxAttempts: number = RETRY_CONFIG.MAX_DOWNLOAD_ATTEMPTS
    ): Promise<DownloadResult> {
        const filePath = path.join(this.downloadPath, fileName);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                adventureLogger.download(`📥 Descargando: ${fileName} (intento ${attempt}/${maxAttempts})`);

                // ✅ OPTIMIZACIÓN: Timeout más corto y específico
                const downloadPromise = download.saveAs(filePath);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout de descarga')), TIMEOUTS.DOWNLOAD)
                );

                await Promise.race([downloadPromise, timeoutPromise]);

                // ✅ OPTIMIZACIÓN: Verificación más rápida
                await this.waitForFileStability(filePath);

                const validation = this.validateDownload(filePath);

                if (validation.isValid) {
                    adventureLogger.success(`✅ Descarga exitosa: ${fileName} (${validation.size} bytes)`);
                    return {
                        success: true,
                        filePath,
                        fileSize: validation.size
                    };
                } else {
                    throw new Error(validation.error || 'Archivo descargado inválido');
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                adventureLogger.error(`❌ Intento ${attempt} fallido: ${errorMessage}`);

                if (attempt === maxAttempts) {
                    return {
                        success: false,
                        error: `Fallo después de ${maxAttempts} intentos: ${errorMessage}`
                    };
                }

                // ✅ OPTIMIZACIÓN: Delay más corto entre reintentos
                adventureLogger.download(`⏳ Reintentando en ${RETRY_CONFIG.RETRY_DELAY / 2}ms...`);
                await delay(RETRY_CONFIG.RETRY_DELAY / 2);
            }
        }

        return {
            success: false,
            error: 'No se pudo completar la descarga'
        };
    }

    /**
     * Espera a que el archivo esté completamente descargado y estable
     */
    private async waitForFileStability(filePath: string, maxWaitTime: number = 5000): Promise<void> {
        const startTime = Date.now();
        let lastSize = 0;
        let stableCount = 0;

        while (Date.now() - startTime < maxWaitTime) {
            if (existsSync(filePath)) {
                const currentSize = statSync(filePath).size;

                if (currentSize === lastSize && currentSize > 0) {
                    stableCount++;
                    if (stableCount >= 2) {
                        // Archivo estable durante 2 verificaciones consecutivas
                        return;
                    }
                } else {
                    stableCount = 0;
                }

                lastSize = currentSize;
            }

            await delay(250); // Verificar cada 250ms
        }
    }

    /**
     * Valida que un archivo descargado sea válido - OPTIMIZADO
     */
    private validateDownload(filePath: string): { isValid: boolean; error?: string; size?: number } {
        try {
            if (!existsSync(filePath)) {
                return { isValid: false, error: 'Archivo no existe después de la descarga' };
            }

            const stats = statSync(filePath);

            // ✅ OPTIMIZACIÓN: Validación más permisiva para archivos pequeños pero válidos
            if (stats.size < 500) {
                return {
                    isValid: false,
                    error: `Archivo demasiado pequeño: ${stats.size} bytes`,
                    size: stats.size
                };
            }

            // ✅ OPTIMIZACIÓN: Verificación básica de PDF
            if (filePath.endsWith('.pdf')) {
                const fs = require('fs');
                const buffer = fs.readFileSync(filePath, { start: 0, end: 4 });
                const header = buffer.toString();

                if (!header.startsWith('%PDF')) {
                    return {
                        isValid: false,
                        error: 'El archivo no es un PDF válido',
                        size: stats.size
                    };
                }
            }

            return { isValid: true, size: stats.size };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error de validación';
            return { isValid: false, error: errorMessage };
        }
    }

    /**
     * Maneja una descarga iniciada por click en un botón - OPTIMIZADO
     */
    async handleButtonDownload(
        buttonSelector: string,
        fileName: string
    ): Promise<DownloadResult> {
        try {
            const page = this.browserService.getPage();

            adventureLogger.download(`📥 Iniciando descarga: ${fileName}`);

            // ✅ OPTIMIZACIÓN: Verificar si el archivo ya existe
            if (this.isFileDownloaded(fileName)) {
                adventureLogger.download(`📄 Archivo ya existe: ${fileName}`);
                return {
                    success: true,
                    filePath: this.getDownloadPath(fileName),
                    fileSize: statSync(this.getDownloadPath(fileName)).size
                };
            }

            // ✅ OPTIMIZACIÓN: Setup de descarga más eficiente
            let download: Download;

            try {
                // Timeout más corto para click + descarga
                const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
                const clickPromise = this.browserService.click(buttonSelector);

                await clickPromise;
                download = await downloadPromise;

                adventureLogger.download(`📦 Descarga iniciada para: ${fileName}`);
            } catch (error) {
                throw new Error(`No se pudo iniciar la descarga: ${error}`);
            }

            return await this.downloadWithRetries(download, fileName);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error en descarga';
            adventureLogger.error(`❌ Error al manejar descarga: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Obtiene la ruta completa de un archivo en el directorio de descargas
     */
    getDownloadPath(fileName: string): string {
        return path.join(this.downloadPath, fileName);
    }

    /**
     * Lista todos los archivos descargados
     */
    getDownloadedFiles(): string[] {
        try {
            const fs = require('fs');
            const files = fs.readdirSync(this.downloadPath);
            return files.filter((file: string) => file && file.endsWith('.pdf'));
        } catch (error) {
            adventureLogger.error('Error listando archivos descargados', error);
            return [];
        }
    }

    /**
     * Limpia archivos descargados
     */
    async cleanDownloads(): Promise<void> {
        try {
            const fs = require('fs-extra');
            await fs.emptyDir(this.downloadPath);
            adventureLogger.download('📁 Directorio de descargas limpiado');
        } catch (error) {
            adventureLogger.error('Error limpiando descargas', error);
            throw error;
        }
    }

    /**
     * Obtiene el tamaño total de todos los archivos descargados
     */
    getTotalDownloadSize(): number {
        try {
            const files = this.getDownloadedFiles();
            let totalSize = 0;

            for (const file of files) {
                const filePath = this.getDownloadPath(file);
                if (existsSync(filePath)) {
                    totalSize += statSync(filePath).size;
                }
            }

            return totalSize;
        } catch (error) {
            adventureLogger.error('Error calculando tamaño total', error);
            return 0;
        }
    }

    /**
     * Verifica si un archivo específico ya fue descargado - OPTIMIZADO
     */
    isFileDownloaded(fileName: string): boolean {
        const filePath = this.getDownloadPath(fileName);
        try {
            return existsSync(filePath) && statSync(filePath).size > 500;
        } catch {
            return false;
        }
    }

    /**
     * Establece un directorio de descargas personalizado
     */
    setDownloadPath(newPath: string): void {
        this.downloadPath = newPath;
        this.ensureDownloadDirectory();
        adventureLogger.download(`Directorio de descargas cambiado a: ${newPath}`);
    }

    /**
     * ✅ NUEVO: Método para limpiar descargas parciales o corruptas
     */
    async cleanPartialDownloads(): Promise<void> {
        try {
            const files = this.getDownloadedFiles();
            let cleaned = 0;

            for (const file of files) {
                const filePath = this.getDownloadPath(file);
                const validation = this.validateDownload(filePath);

                if (!validation.isValid) {
                    const fs = require('fs-extra');
                    await fs.remove(filePath);
                    adventureLogger.download(`🗑️ Archivo corrupto eliminado: ${file}`);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                adventureLogger.download(`🧹 Se limpiaron ${cleaned} archivos corruptos`);
            }
        } catch (error) {
            adventureLogger.error('Error limpiando archivos parciales', error);
        }
    }

    /**
     * ✅ NUEVO: Obtiene estadísticas de descarga
     */
    getDownloadStats(): {
        totalFiles: number;
        totalSize: number;
        averageSize: number;
        validFiles: number;
    } {
        const files = this.getDownloadedFiles();
        let totalSize = 0;
        let validFiles = 0;

        for (const file of files) {
            const filePath = this.getDownloadPath(file);
            const validation = this.validateDownload(filePath);

            if (validation.isValid && validation.size) {
                totalSize += validation.size;
                validFiles++;
            }
        }

        return {
            totalFiles: files.length,
            totalSize,
            averageSize: validFiles > 0 ? Math.round(totalSize / validFiles) : 0,
            validFiles
        };
    }
}