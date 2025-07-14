#!/usr/bin/env node

/**
 * Sherpa Manuscript Automation - Main Entry Point
 *
 * Automatizador profesional para el desafío técnico de manuscritos sagrados
 * Versión en TypeScript con arquitectura modular y logging avanzado
 */

import { BrowserService } from '@/services/browser.service';
import { AuthService } from '@/services/auth.service';
import { ManuscriptService } from '@/services/manuscript.service';
import { PDFService } from '@/services/pdf.service';
import { APIService } from '@/services/api.service';
import { DownloadService } from '@/services/download.service';
import { PaginationService } from '@/services/pagination.service';
import { appConfig } from '@/config/app.config';
import { adventureLogger } from '@/utils/logger';
import { formatTime } from '@/utils/helpers';
import { ExecutionSummary } from '@/types';

class SherpaManuscriptAutomation {
    private browserService: BrowserService;
    private authService: AuthService;
    private manuscriptService: ManuscriptService;
    private paginationService: PaginationService;
    private startTime: number = 0;

    constructor() {
        // Inicializar servicios
        this.browserService = new BrowserService();
        this.authService = new AuthService(this.browserService);

        const pdfService = new PDFService();
        const apiService = new APIService();
        const downloadService = new DownloadService(this.browserService);

        this.manuscriptService = new ManuscriptService(
            this.browserService,
            pdfService,
            apiService,
            downloadService
        );

        this.paginationService = new PaginationService(this.browserService);
    }

    /**
     * Ejecuta la aventura completa de automatización
     */
    async runAdventure(): Promise<void> {
        try {
            await this.initializeAdventure();
            await this.performAuthentication();

            const summary = await this.processAllManuscripts();

            this.displayFinalSummary(summary);

        } catch (error) {
            adventureLogger.error('💥 ERROR CRÍTICO EN LA AVENTURA', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Inicializa la aventura y el browser
     */
    private async initializeAdventure(): Promise<void> {
        this.startTime = Date.now();

        adventureLogger.bigSeparator();
        adventureLogger.adventure('🎯 Iniciando configuración de la aventura...');

        // Log de configuración
        adventureLogger.adventure('⚙️ Configuración cargada:', {
            url: appConfig.app.url,
            maxPages: appConfig.app.maxPages,
            headless: appConfig.browser.headless,
            downloadPath: appConfig.app.downloadPath
        });

        // Inicializar browser
        await this.browserService.initialize();
        adventureLogger.success('🌟 ¡Aventura lista para comenzar!');
    }

    /**
     * Realiza el proceso de autenticación
     */
    private async performAuthentication(): Promise<void> {
        adventureLogger.adventure('🔐 Iniciando ritual de autenticación...');
        await this.authService.login();
        adventureLogger.success('🏰 ¡Acceso a la cripta concedido! Portal abierto.');
    }

    /**
     * Procesa todos los manuscritos en todas las páginas
     */
    private async processAllManuscripts(): Promise<ExecutionSummary> {
        let codigoPrevio: string | null = null;
        let hayMasPaginas = true;
        let paginaActual = 1;
        let paginasSinManuscritos = 0;
        let totalManuscritos = 0;
        const errores: string[] = [];

        adventureLogger.adventure('📚 Comenzando exploración de manuscritos...');

        while (hayMasPaginas && paginaActual <= appConfig.app.maxPages) {
            adventureLogger.pagination(`📄 ========== PROCESANDO PÁGINA ${paginaActual} ==========`);

            try {
                const { processedCount, lastCode } = await this.manuscriptService.processManuscriptsOnPage(
                    paginaActual,
                    codigoPrevio
                );

                if (processedCount === 0) {
                    paginasSinManuscritos++;
                    adventureLogger.warning(`⚠️ Página ${paginaActual} sin manuscritos procesados`);

                    if (paginasSinManuscritos >= 2) {
                        adventureLogger.adventure(`🏁 Deteniendo: ${paginasSinManuscritos} páginas consecutivas sin manuscritos`);
                        break;
                    }
                } else {
                    paginasSinManuscritos = 0;
                    totalManuscritos += processedCount;
                    codigoPrevio = lastCode;
                    adventureLogger.success(`✅ Página ${paginaActual}: ${processedCount} manuscritos procesados`);
                }

                // Buscar siguiente página
                const navigationResult = await this.paginationService.navigateToNextPage(paginaActual);

                if (navigationResult.success) {
                    paginaActual = navigationResult.newPage;
                } else {
                    hayMasPaginas = false;
                    adventureLogger.adventure('🏁 No hay más páginas disponibles');
                }

                if (paginaActual > appConfig.app.maxPages) {
                    adventureLogger.adventure(`🛑 Límite de páginas alcanzado (${appConfig.app.maxPages})`);
                    hayMasPaginas = false;
                }

            } catch (error) {
                const errorMsg = `Error en página ${paginaActual}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                errores.push(errorMsg);
                adventureLogger.error(errorMsg, error);

                // Continuar con la siguiente página en caso de error
                paginaActual++;
            }
        }

        const executionTime = Date.now() - this.startTime;

        return this.manuscriptService.generateExecutionSummary(
            paginaActual - 1,
            totalManuscritos,
            executionTime,
            errores
        );
    }

    /**
     * Muestra el resumen final de la aventura
     */
    private displayFinalSummary(summary: ExecutionSummary): void {
        adventureLogger.endSeparator();

        // Mostrar resumen de códigos obtenidos
        adventureLogger.summary('\n📊 ========== RESUMEN DE CÓDIGOS OBTENIDOS ==========');

        if (summary.PDFs.length > 0) {
            adventureLogger.summary('\n📄 CÓDIGOS EXTRAÍDOS DE PDFs:');
            summary.PDFs.forEach((item, index) => {
                adventureLogger.summary(`   ${index + 1}. ${item.manuscrito} (Siglo ${item.siglo}) → "${item.codigoExtraido}"`);
            });
        }

        if (summary.APIs.length > 0) {
            adventureLogger.summary('\n🌐 CÓDIGOS OBTENIDOS DE APIs (Desafíos Resueltos):');
            summary.APIs.forEach((item, index) => {
                adventureLogger.summary(`   ${index + 1}. ${item.manuscrito} (Siglo ${item.siglo})`);
                adventureLogger.summary(`      📥 Input: "${item.codigoInput}"`);
                adventureLogger.summary(`      📤 Output: "${item.codigoObtenido}"`);
            });
        }

        // Estadísticas finales
        adventureLogger.summary(`\n🏆 ESTADÍSTICAS FINALES:`);
        adventureLogger.summary(`   📊 Total códigos obtenidos: ${summary.totalCodigos} (${summary.PDFs.length} de PDFs + ${summary.APIs.length} de APIs)`);
        adventureLogger.summary(`   📚 Manuscritos procesados: ${summary.manuscritosProcesados}`);
        adventureLogger.summary(`   📄 Páginas recorridas: ${summary.paginasRecorridas}`);
        adventureLogger.summary(`   ⏱️ Tiempo de ejecución: ${formatTime(summary.tiempoEjecucion)}`);

        if (summary.errores.length > 0) {
            adventureLogger.summary(`   ⚠️ Errores encontrados: ${summary.errores.length}`);
            summary.errores.forEach((error, index) => {
                adventureLogger.warning(`      ${index + 1}. ${error}`);
            });
        }

        adventureLogger.summary('📊 ====================================================');

        // Mensaje final
        if (summary.totalCodigos > 0) {
            adventureLogger.adventure('🎉 ¡AVENTURA COMPLETADA CON ÉXITO!');
            adventureLogger.adventure('🏆 ¡Has demostrado tu maestría en el scraping arcano!');
        } else {
            adventureLogger.warning('⚠️ Aventura completada pero sin códigos obtenidos');
        }
    }

    /**
     * Limpieza final y cierre del browser
     */
    private async cleanup(): Promise<void> {
        try {
            await this.browserService.close();
            adventureLogger.adventure('🔒 Recursos liberados correctamente');
        } catch (error) {
            adventureLogger.error('Error durante la limpieza', error);
        }
    }
}

/**
 * Función principal de entrada
 */
async function main(): Promise<void> {
    const automation = new SherpaManuscriptAutomation();

    // Manejar señales de salida
    process.on('SIGINT', async () => {
        adventureLogger.adventure('🛑 Señal de interrupción recibida, cerrando aplicación...');
        process.exit(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
        adventureLogger.error('Rechazo no manejado:', reason);
        process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        adventureLogger.error('Excepción no capturada:', error);
        process.exit(1);
    });

    try {
        await automation.runAdventure();
        process.exit(0);
    } catch (error) {
        adventureLogger.error('Error fatal en la aplicación:', error);
        process.exit(1);
    }
}

// Ejecutar solo si es el módulo principal
if (require.main === module) {
    main().catch((error) => {
        console.error('Error crítico:', error);
        process.exit(1);
    });
}

export default SherpaManuscriptAutomation;