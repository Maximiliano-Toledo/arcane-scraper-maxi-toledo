import { Download } from 'playwright';
import { existsSync, statSync, ensureDirSync } from 'fs-extra';
import path from 'path';
import { BrowserService } from './browser.service';
import { appConfig } from '@/config/app.config';
import { DownloadResult } from '@/types';
import { RETRY_CONFIG } from '@/constants';
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
     * Descarga un archivo con reintentos automáticos
     */
    async downloadWithRetries(
        download: Download,
        fileName: string,
        maxAttempts: number = RETRY_CONFIG.MAX_DOWNLOAD_ATTEMPTS
    ): Promise<DownloadResult> {
        const filePath = path.join(this.downloadPath, fileName);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                adventureLogger.download(`📥 Intento ${attempt} de descarga: ${fileName}`);

                await download.saveAs(filePath);

                // Verificar que el archivo se descargó correctamente
                const validation = this.validateDownload(filePath);

                if (validation.isValid) {
                    adventureLogger.success(`✅ Descarga exitosa: ${fileName} (${validation.size} bytes)`);
                    return {
                        success: true,
                        filePath,
                        fileSize: validation.size
                    };
                } else {
                    throw new Error(validation.error || 'Archivo descargado está vacío o corrupto');
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

                adventureLogger.download(`⏳ Esperando ${RETRY_CONFIG.RETRY_DELAY}ms antes del siguiente intento...`);
                await delay(RETRY_CONFIG.RETRY_DELAY);
            }
        }

        return {
            success: false,
            error: 'No se pudo completar la descarga'
        };
    }

    /**
     * Valida que un archivo descargado sea válido
     */
    private validateDownload(filePath: string): { isValid: boolean; error?: string; size?: number } {
        try {
            if (!existsSync(filePath)) {
                return { isValid: false, error: 'Archivo no existe después de la descarga' };
            }

            const stats = statSync(filePath);

            if (stats.size < 1000) {
                return {
                    isValid: false,
                    error: `Archivo demasiado pequeño: ${stats.size} bytes`,
                    size: stats.size
                };
            }

            return { isValid: true, size: stats.size };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error de validación';
            return { isValid: false, error: errorMessage };
        }
    }

    /**
     * Maneja una descarga iniciada por click en un botón
     */
    async handleButtonDownload(
        buttonSelector: string,
        fileName: string
    ): Promise<DownloadResult> {
        try {
            const page = this.browserService.getPage();

            adventureLogger.download(`📥 Iniciando descarga con botón: ${buttonSelector}`);

            const [download] = await Promise.all([
                page.waitForEvent('download'),
                this.browserService.click(buttonSelector)
            ]);

            return await this.downloadWithRetries(download, fileName);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error en descarga';
            adventureLogger.error(`Error al manejar descarga de botón`, error);
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
     * Verifica si un archivo específico ya fue descargado
     */
    isFileDownloaded(fileName: string): boolean {
        const filePath = this.getDownloadPath(fileName);
        return existsSync(filePath) && statSync(filePath).size > 1000;
    }

    /**
     * Establece un directorio de descargas personalizado
     */
    setDownloadPath(newPath: string): void {
        this.downloadPath = newPath;
        this.ensureDownloadDirectory();
        adventureLogger.download(`Directorio de descargas cambiado a: ${newPath}`);
    }
}