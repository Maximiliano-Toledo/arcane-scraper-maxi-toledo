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
    /**
     * Muestra el resumen final con todos los códigos obtenidos
     */
    private displayFinalSummary(summary: ExecutionSummary): void {
        const tiempoTotal = Date.now() - this.startTime;
        const tiempoFormateado = formatTime(tiempoTotal);

        adventureLogger.bigSeparator();
        adventureLogger.adventure('🏆 ===============================================');
        adventureLogger.adventure('🏆          RESUMEN FINAL DE LA AVENTURA');
        adventureLogger.adventure('🏆 ===============================================');

        // Estadísticas generales
        adventureLogger.summary(`📊 Manuscritos procesados: ${summary.manuscritosProcesados}`);
        adventureLogger.summary(`📄 Páginas recorridas: ${summary.paginasRecorridas}`);
        adventureLogger.summary(`⏱️ Tiempo total de ejecución: ${tiempoFormateado}`);
        adventureLogger.summary(`🔑 Total de códigos obtenidos: ${summary.totalCodigos}`);

        adventureLogger.separator();

        // CÓDIGOS DE PDFs
        if (summary.PDFs.length > 0) {
            adventureLogger.adventure('📚 ===============================================');
            adventureLogger.adventure('📚           CÓDIGOS EXTRAÍDOS DE PDFs');
            adventureLogger.adventure('📚 ===============================================');

            summary.PDFs.forEach((pdf, index) => {
                if (pdf.codigoExtraido) {
                    adventureLogger.code(`📜 ${index + 1}. "${pdf.manuscrito}" (${pdf.siglo})`);
                    adventureLogger.code(`   🗝️ Código: ${pdf.codigoExtraido}`);
                    adventureLogger.code('   ──────────────────────────────────────');
                }
            });

            // Lista compacta de códigos PDF
            const codigosPDF = summary.PDFs
                .filter(pdf => pdf.codigoExtraido)
                .map(pdf => pdf.codigoExtraido);

            adventureLogger.adventure('📋 RESUMEN DE CÓDIGOS PDF:');
            adventureLogger.code(`   [${codigosPDF.join(', ')}]`);
        } else {
            adventureLogger.warning('📚 No se extrajeron códigos de PDFs');
        }

        adventureLogger.separator();

        // CÓDIGOS DE APIs
        if (summary.APIs.length > 0) {
            adventureLogger.adventure('🌐 ===============================================');
            adventureLogger.adventure('🌐           CÓDIGOS OBTENIDOS DE APIs');
            adventureLogger.adventure('🌐 ===============================================');

            summary.APIs.forEach((api, index) => {
                adventureLogger.api(`🔗 ${index + 1}. "${api.manuscrito}" (${api.siglo})`);
                if (api.codigoInput) {
                    adventureLogger.api(`   📥 Input: ${api.codigoInput}`);
                }
                if (api.codigoObtenido) {
                    adventureLogger.api(`   📤 Output: ${api.codigoObtenido}`);
                }
                adventureLogger.api('   ──────────────────────────────────────');
            });

            // Lista compacta de códigos API
            const codigosAPI = summary.APIs
                .filter(api => api.codigoObtenido)
                .map(api => api.codigoObtenido);

            adventureLogger.adventure('📋 RESUMEN DE CÓDIGOS API:');
            adventureLogger.api(`   [${codigosAPI.join(', ')}]`);
        } else {
            adventureLogger.warning('🌐 No se obtuvieron códigos de APIs');
        }

        adventureLogger.separator();

        // RESUMEN CONSOLIDADO
        adventureLogger.adventure('🎯 ===============================================');
        adventureLogger.adventure('🎯        TODOS LOS CÓDIGOS OBTENIDOS');
        adventureLogger.adventure('🎯 ===============================================');

        const todosLosCodigos = [
            ...summary.PDFs.filter(pdf => pdf.codigoExtraido).map(pdf => ({
                codigo: pdf.codigoExtraido!,
                fuente: 'PDF',
                manuscrito: pdf.manuscrito,
                siglo: pdf.siglo
            })),
            ...summary.APIs.filter(api => api.codigoObtenido).map(api => ({
                codigo: api.codigoObtenido!,
                fuente: 'API',
                manuscrito: api.manuscrito,
                siglo: api.siglo
            }))
        ];

        if (todosLosCodigos.length > 0) {
            todosLosCodigos.forEach((item, index) => {
                const emoji = item.fuente === 'PDF' ? '📜' : '🌐';
                adventureLogger.success(`${emoji} ${index + 1}. ${item.codigo} (${item.fuente}) - "${item.manuscrito}" (${item.siglo})`);
            });

            adventureLogger.adventure('');
            adventureLogger.adventure('📝 LISTA FINAL DE CÓDIGOS:');
            const listaFinal = todosLosCodigos.map(item => item.codigo).join(', ');
            adventureLogger.success(`   [${listaFinal}]`);

            // Estadísticas por fuente
            const codigosPorFuente = todosLosCodigos.reduce((acc, item) => {
                acc[item.fuente] = (acc[item.fuente] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            adventureLogger.adventure('');
            adventureLogger.adventure('📊 ESTADÍSTICAS DETALLADAS:');
            Object.entries(codigosPorFuente).forEach(([fuente, cantidad]) => {
                const emoji = fuente === 'PDF' ? '📜' : '🌐';
                adventureLogger.summary(`   ${emoji} Códigos de ${fuente}: ${cantidad}`);
            });
        } else {
            adventureLogger.warning('❌ No se obtuvieron códigos en esta ejecución');
        }

        // Errores si los hay
        if (summary.errores.length > 0) {
            adventureLogger.separator();
            adventureLogger.adventure('⚠️ ===============================================');
            adventureLogger.adventure('⚠️                 ERRORES ENCONTRADOS');
            adventureLogger.adventure('⚠️ ===============================================');

            summary.errores.forEach((error, index) => {
                adventureLogger.error(`${index + 1}. ${error}`);
            });
        }

        adventureLogger.separator();

        // Mensaje final
        if (summary.totalCodigos > 0) {
            adventureLogger.adventure('🎉 ¡AVENTURA COMPLETADA CON ÉXITO!');
            adventureLogger.adventure('🏆 ¡Has demostrado tu maestría en el scraping arcano!');
            adventureLogger.adventure(`🗝️ Total de códigos conquistados: ${summary.totalCodigos}`);
        } else {
            adventureLogger.warning('⚠️ Aventura completada pero sin códigos obtenidos');
        }

        adventureLogger.adventure('🏰 ===============================================');
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