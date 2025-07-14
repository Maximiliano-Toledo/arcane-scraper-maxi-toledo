import { BrowserService } from './browser.service';
import { PDFService } from './pdf.service';
import { APIService } from './api.service';
import { DownloadService } from './download.service';
import { SELECTORS, TIMEOUTS, RETRY_CONFIG } from '@/constants';
import { ManuscriptType, ManuscriptInfo, ProcessedManuscript, CodeResult, ExecutionSummary } from '@/types';
import {
    convertRomanToNumber,
    sanitizeFileName,
    isValidManuscript,
    extractBookTitleFromModal,
    delay
} from '@/utils/helpers';
import { isNonEmptyString, safeRegexMatch, extractCaptureGroup, createSafeWaitOptions } from '@/utils/types';
import { adventureLogger } from '@/utils/logger';

export class ManuscriptService {
    private codigosObtenidos: {
        PDFs: CodeResult[];
        APIs: CodeResult[];
    } = {
        PDFs: [],
        APIs: []
    };

    constructor(
        private browserService: BrowserService,
        private pdfService: PDFService,
        private apiService: APIService,
        private downloadService: DownloadService
    ) {}

    /**
     * Procesa todos los manuscritos de una página
     */
    async processManuscriptsOnPage(
        currentPage: number,
        previousCode: string | null
    ): Promise<{ processedCount: number; lastCode: string | null }> {
        let manuscriptsProcessed = 0;
        let lastExtractedCode = previousCode;

        await this.browserService.wait(2000);

        // Buscar manuscritos con selectores múltiples
        const manuscriptsInfo = await this.findManuscriptsOnPage();

        if (manuscriptsInfo.length === 0) {
            adventureLogger.warning('❌ No se encontraron manuscritos en esta página.');
            return { processedCount: 0, lastCode: lastExtractedCode };
        }

        // Ordenar por siglo cronológico
        const sortedManuscripts = this.sortManuscriptsByChronology(manuscriptsInfo);

        adventureLogger.manuscript(`📚 Procesando ${sortedManuscripts.length} manuscritos en orden cronológico`);

        // ✅ CORRECCIÓN: Verificar que el manuscriptInfo existe antes de usarlo
        for (let i = 0; i < sortedManuscripts.length; i++) {
            const manuscriptInfo = sortedManuscripts[i];

            // ✅ Type guard para verificar que manuscriptInfo existe
            if (!manuscriptInfo) {
                adventureLogger.warning(`⚠️ Manuscrito en índice ${i} es undefined, saltando...`);
                continue;
            }

            const nextManuscriptCentury = sortedManuscripts[i + 1]?.siglo || '?';

            adventureLogger.manuscript(`\n📜 ========================================`);
            adventureLogger.manuscript(`📜 PROCESANDO MANUSCRITO ${i + 1}/${sortedManuscripts.length} (Orden cronológico)`);
            adventureLogger.manuscript(`📜 Título: "${manuscriptInfo.titulo}"`);
            adventureLogger.manuscript(`📜 Siglo: ${manuscriptInfo.siglo} (${manuscriptInfo.sigloNumerico})`);
            adventureLogger.manuscript(`📜 Estado: ${manuscriptInfo.estado}`);
            adventureLogger.manuscript(`📜 ========================================`);

            const result = await this.processIndividualManuscript(
                manuscriptInfo,
                lastExtractedCode,
                nextManuscriptCentury
            );

            if (result.success && result.extractedCode) {
                lastExtractedCode = result.extractedCode;
                manuscriptsProcessed++;
            }

            await this.browserService.wait(1000);
        }

        return { processedCount: manuscriptsProcessed, lastCode: lastExtractedCode };
    }

    /**
     * Encuentra todos los manuscritos en la página actual
     */
    private async findManuscriptsOnPage(): Promise<ManuscriptInfo[]> {
        const manuscriptsInfo: ManuscriptInfo[] = [];

        for (const selector of SELECTORS.MANUSCRIPTS.CONTAINERS) {
            try {
                adventureLogger.debug(`🔍 Probando selector: ${selector}`);
                const elementos = await this.browserService.getAllElements(selector);
                adventureLogger.debug(`📊 Encontrados ${elementos.length} elementos`);

                if (elementos.length > 0) {
                    const validManuscripts = await this.validateAndClassifyManuscripts(elementos);

                    if (validManuscripts.length > 0) {
                        manuscriptsInfo.push(...validManuscripts);
                        adventureLogger.success(`✅ Selector exitoso: ${selector} - ${validManuscripts.length} manuscritos válidos`);
                        break;
                    }
                }
            } catch (error) {
                adventureLogger.error(`❌ Error con selector ${selector}`, error);
            }
        }

        return manuscriptsInfo;
    }

    /**
     * Valida y clasifica elementos como manuscritos
     */
    private async validateAndClassifyManuscripts(elementos: any[]): Promise<ManuscriptInfo[]> {
        const manuscritos: ManuscriptInfo[] = [];

        for (let i = 0; i < elementos.length; i++) {
            const elemento = elementos[i];

            try {
                const texto = await elemento.textContent();

                if (isValidManuscript(texto)) {
                    const h3Element = await elemento.$('h3');
                    const titulo = h3Element ? await h3Element.textContent() : `Manuscrito_${i + 1}`;

                    let siglo = 'XX';
                    const sigloMatch = texto.match(/Siglo\s+([IVXLC]+)/i);
                    if (sigloMatch) siglo = sigloMatch[1];

                    const estado = await this.detectManuscriptType(elemento, texto);

                    manuscritos.push({
                        elemento,
                        titulo: titulo?.trim() || `Manuscrito_${i + 1}`,
                        siglo,
                        sigloNumerico: convertRomanToNumber(siglo),
                        estado,
                        indice: i
                    });

                    adventureLogger.manuscript(`📋 Manuscrito ${i + 1}: "${titulo}" - Siglo ${siglo} (${convertRomanToNumber(siglo)}) - ${estado}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                adventureLogger.warning(`⚠️ Error procesando manuscrito ${i + 1}: ${errorMessage}`);
            }
        }

        return manuscritos;
    }

    /**
     * Detecta el tipo de manuscrito basado en sus elementos
     */
    private async detectManuscriptType(elemento: any, texto: string): Promise<ManuscriptType> {
        // 1. Verificar si tiene botón "Descargar PDF" (ya desbloqueado)
        const botonDescarga = await elemento.$(SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON);
        if (botonDescarga) {
            return ManuscriptType.UNLOCKED;
        }

        // 2. Verificar si tiene input para código (bloqueado normal)
        const inputCodigo = await elemento.$(SELECTORS.MANUSCRIPTS.CODE_INPUT);
        if (inputCodigo) {
            return ManuscriptType.LOCKED;
        }

        // 3. Verificar si tiene botón "Ver Documentación" (requiere API)
        for (const docSelector of SELECTORS.MANUSCRIPTS.DOCUMENTATION_BUTTON) {
            const botonDoc = await elemento.$(docSelector);
            if (botonDoc) {
                return ManuscriptType.DOCUMENTATION;
            }
        }

        // 4. Verificar por texto contenido
        if (texto.includes('Ver Documentación')) {
            return ManuscriptType.DOCUMENTATION;
        } else if (texto.includes('Descargar PDF')) {
            return ManuscriptType.UNLOCKED;
        } else if (texto.includes('código') || texto.includes('Desbloquear')) {
            return ManuscriptType.LOCKED;
        }

        return ManuscriptType.LOCKED; // Default
    }

    /**
     * Ordena manuscritos por cronología
     */
    private sortManuscriptsByChronology(manuscritos: ManuscriptInfo[]): ManuscriptInfo[] {
        return manuscritos.sort((a, b) => a.sigloNumerico - b.sigloNumerico);
    }

    /**
     * Procesa un manuscrito individual según su tipo
     */
    private async processIndividualManuscript(
        manuscriptInfo: ManuscriptInfo,
        previousCode: string | null,
        nextCentury: string
    ): Promise<{ success: boolean; extractedCode?: string }> {
        const nombrePDF = sanitizeFileName(manuscriptInfo.titulo);

        try {
            switch (manuscriptInfo.estado) {
                case ManuscriptType.UNLOCKED:
                    return await this.processUnlockedManuscript(manuscriptInfo, nombrePDF, nextCentury);

                case ManuscriptType.LOCKED:
                    return await this.processLockedManuscript(manuscriptInfo, nombrePDF, previousCode, nextCentury);

                case ManuscriptType.DOCUMENTATION:
                    return await this.processDocumentationManuscript(manuscriptInfo, nombrePDF, previousCode, nextCentury);

                default:
                    adventureLogger.warning(`❓ Estado del manuscrito no reconocido: ${manuscriptInfo.estado}`);
                    return { success: false };
            }
        } catch (error) {
            adventureLogger.error(`Error procesando manuscrito ${manuscriptInfo.titulo}`, error);
            return { success: false };
        }
    }

    private addPDFCode(manuscriptInfo: ManuscriptInfo, codigo: string) {
        const yaExiste = this.codigosObtenidos.PDFs.some(p =>
            p.codigoExtraido === codigo && p.manuscrito === manuscriptInfo.titulo
        );

        if (yaExiste) {
            adventureLogger.debug(`🟡 Código duplicado detectado para "${manuscriptInfo.titulo}", no se guarda.`);
            return;
        }

        this.codigosObtenidos.PDFs.push({
            manuscrito: manuscriptInfo.titulo,
            siglo: manuscriptInfo.siglo,
            codigoExtraido: codigo
        });

        adventureLogger.code(`🗝️ Código guardado: "${codigo}" para "${manuscriptInfo.titulo}"`);
    }


    /**
     * Procesa manuscrito ya desbloqueado
     */
    private async processUnlockedManuscript(
        manuscriptInfo: ManuscriptInfo,
        nombrePDF: string,
        nextCentury: string
    ): Promise<{ success: boolean; extractedCode?: string }> {
        adventureLogger.manuscript('🔓 Manuscrito ya está desbloqueado, procediendo a descargar...');

        const result = await this.downloadService.handleButtonDownload(
            SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON,
            `${nombrePDF}.pdf`
        );

        if (result.success && result.filePath) {
            const codigo = await this.pdfService.extractCodeFromPDF(result.filePath);

            if (codigo) {
                adventureLogger.code(`🗝️ Código guardado para próximo manuscrito (Siglo ${nextCentury}): "${codigo}"`);

                this.addPDFCode(manuscriptInfo, codigo);

                return { success: true, extractedCode: codigo };
            } else {
                adventureLogger.warning('⚠️ No se pudo extraer código de este manuscrito');
                return { success: true };
            }
        }

        return { success: false };
    }

    /**
     * Procesa manuscrito bloqueado
     */
    private async processLockedManuscript(
        manuscriptInfo: ManuscriptInfo,
        nombrePDF: string,
        previousCode: string | null,
        nextCentury: string
    ): Promise<{ success: boolean; extractedCode?: string }> {
        if (!previousCode) {
            adventureLogger.error('❌ No hay código previo disponible para desbloquear este manuscrito');
            return { success: false };
        }

        adventureLogger.manuscript(`🔐 Manuscrito bloqueado. Desbloqueando con código: "${previousCode}"`);

        // Llenar campo de código
        const inputCodigo = await manuscriptInfo.elemento.$(SELECTORS.MANUSCRIPTS.CODE_INPUT);
        if (!inputCodigo) {
            adventureLogger.error('❌ No se encontró input de código');
            return { success: false };
        }

        await inputCodigo.fill(previousCode);
        await this.browserService.wait(500);

        // Click en desbloquear
        const botonDesbloquear = await manuscriptInfo.elemento.$(SELECTORS.MANUSCRIPTS.UNLOCK_BUTTON);
        if (botonDesbloquear) {
            await botonDesbloquear.click();
            adventureLogger.manuscript(`🔓 Botón desbloquear clickeado`);
        }

        try {
            // Esperar que aparezca el botón de descarga
            const waitOptions = createSafeWaitOptions(TIMEOUTS.UNLOCK);
            await manuscriptInfo.elemento.waitForSelector(SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON, waitOptions);

            adventureLogger.success('✅ ¡Manuscrito desbloqueado exitosamente!');

            // Descargar
            const result = await this.downloadService.handleButtonDownload(
                SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON,
                `${nombrePDF}.pdf`
            );

            if (result.success && result.filePath) {
                const codigo = await this.pdfService.extractCodeFromPDF(result.filePath);

                if (codigo) {
                    adventureLogger.code(`🗝️ Nuevo código obtenido para Siglo ${nextCentury}: "${codigo}"`);

                    this.codigosObtenidos.PDFs.push({
                        manuscrito: manuscriptInfo.titulo,
                        siglo: manuscriptInfo.siglo,
                        codigoExtraido: codigo
                    });

                    return { success: true, extractedCode: codigo };
                }
            }

            return { success: true };

        } catch (timeoutError) {
            adventureLogger.error(`❌ Timeout esperando desbloqueo del manuscrito`, timeoutError);
            return { success: false };
        }
    }

    /**
     * Procesa manuscrito que requiere documentación y API
     */
    private async processDocumentationManuscript(
        manuscriptInfo: ManuscriptInfo,
        nombrePDF: string,
        previousCode: string | null,
        nextCentury: string
    ): Promise<{ success: boolean; extractedCode?: string }> {
        if (!previousCode) {
            adventureLogger.error('❌ No hay código previo para usar con la API');
            return { success: false };
        }

        adventureLogger.manuscript('📖 Manuscrito requiere consulta de documentación y API...');

        // Buscar botón de documentación
        let botonDocumentacion = null;
        for (const selector of SELECTORS.MANUSCRIPTS.DOCUMENTATION_BUTTON) {
            botonDocumentacion = await manuscriptInfo.elemento.$(selector);
            if (botonDocumentacion) break;
        }

        if (!botonDocumentacion) {
            adventureLogger.error('❌ No se encontró botón "Ver Documentación"');
            return { success: false };
        }

        // Abrir modal de documentación
        await botonDocumentacion.click();
        adventureLogger.manuscript('🔍 Modal de documentación abierto');

        try {
            const modalWaitOptions = createSafeWaitOptions(TIMEOUTS.MODAL);
            await this.browserService.waitForSelector(SELECTORS.MODAL.CONTAINER, TIMEOUTS.MODAL);

            // Extraer bookTitle del modal
            const tituloModal = await this.browserService.getTextContent(SELECTORS.MODAL.TITLE);
            const book = tituloModal ? extractBookTitleFromModal(tituloModal) : manuscriptInfo.titulo;

            adventureLogger.api(`📖 BookTitle extraído: "${book}"`);

            // Cerrar modal
            await this.closeDocumentationModal();

            // Usar API para obtener código
            const codigoAPI = await this.apiService.getCodeFromAPI(book, previousCode);

            if (codigoAPI) {
                // Aplicar código obtenido de la API
                return await this.applyAPICodeToManuscript(
                    manuscriptInfo,
                    nombrePDF,
                    previousCode,
                    codigoAPI,
                    nextCentury
                );
            }

        } catch (error) {
            adventureLogger.error('Error procesando documentación', error);
        }

        return { success: false };
    }

    /**
     * Cierra el modal de documentación
     */
    private async closeDocumentationModal(): Promise<void> {
        const botonCerrar = await this.browserService.getElement(SELECTORS.MODAL.CLOSE_BUTTON);
        if (botonCerrar) {
            await botonCerrar.click();
            adventureLogger.manuscript('✅ Modal cerrado con botón X');
        } else {
            await this.browserService.pressKey('Escape');
            adventureLogger.manuscript('✅ Modal cerrado con Escape');
        }

        await this.browserService.wait(2000);
    }

    /**
     * Aplica código obtenido de la API al manuscrito
     */
    private async applyAPICodeToManuscript(
        manuscriptInfo: ManuscriptInfo,
        nombrePDF: string,
        inputCode: string,
        apiCode: string,
        nextCentury: string
    ): Promise<{ success: boolean; extractedCode?: string }> {
        adventureLogger.api(`🔄 Aplicando código de API: "${apiCode}"`);

        // Guardar para tracking
        this.codigosObtenidos.APIs.push({
            manuscrito: manuscriptInfo.titulo,
            siglo: manuscriptInfo.siglo,
            codigoInput: inputCode,
            codigoObtenido: apiCode
        });

        // Esperar a que aparezca el input de código
        let inputCodigo = null;
        let intentos = 0;
        const maxIntentos = RETRY_CONFIG.MAX_INPUT_ATTEMPTS;

        while (!inputCodigo && intentos < maxIntentos) {
            inputCodigo = await manuscriptInfo.elemento.$(SELECTORS.MANUSCRIPTS.CODE_INPUT);
            if (!inputCodigo) {
                adventureLogger.debug(`🔄 Intento ${intentos + 1}/${maxIntentos}: Esperando que aparezca el input...`);
                await this.browserService.wait(2000);
                intentos++;
            }
        }

        if (!inputCodigo) {
            adventureLogger.error(`❌ No se encontró el input después de ${maxIntentos} intentos`);
            return { success: false };
        }

        // Aplicar código de API
        await inputCodigo.fill(apiCode);
        await this.browserService.wait(1000);

        const botonDesbloquear = await manuscriptInfo.elemento.$(SELECTORS.MANUSCRIPTS.UNLOCK_BUTTON);
        if (botonDesbloquear) {
            await botonDesbloquear.click();
        }

        try {
            // Manejar posible modal de confirmación
            const unlockWaitOptions = createSafeWaitOptions(TIMEOUTS.UNLOCK);
            const confirmationWaitOptions = createSafeWaitOptions(TIMEOUTS.UNLOCK);

            await Promise.race([
                manuscriptInfo.elemento.waitForSelector(SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON, unlockWaitOptions),
                this.browserService.getPage().waitForSelector(SELECTORS.MODAL.CONFIRMATION, confirmationWaitOptions)
            ]);

            // Cerrar modal de confirmación si aparece
            const modalConfirmacion = await this.browserService.getElement(SELECTORS.MODAL.CONFIRMATION);
            if (modalConfirmacion) {
                const botonCerrarModal = await this.browserService.getElement(SELECTORS.MODAL.CLOSE_CONFIRMATION);
                if (botonCerrarModal) {
                    await botonCerrarModal.click();
                    await this.browserService.wait(1000);
                }
            }

            const finalWaitOptions = createSafeWaitOptions(TIMEOUTS.UNLOCK);
            await manuscriptInfo.elemento.waitForSelector(SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON, finalWaitOptions);
            adventureLogger.success('✅ ¡Manuscrito desbloqueado con código de API!');

            // Descargar
            const result = await this.downloadService.handleButtonDownload(
                SELECTORS.MANUSCRIPTS.DOWNLOAD_BUTTON,
                `${nombrePDF}.pdf`
            );

            if (result.success && result.filePath) {
                const codigoPDF = await this.pdfService.extractCodeFromPDF(result.filePath);

                if (codigoPDF) {
                    adventureLogger.code(`🗝️ Código extraído del PDF para próximo manuscrito (Siglo ${nextCentury}): "${codigoPDF}"`);

                    this.codigosObtenidos.PDFs.push({
                        manuscrito: manuscriptInfo.titulo,
                        siglo: manuscriptInfo.siglo,
                        codigoExtraido: codigoPDF
                    });

                    return { success: true, extractedCode: codigoPDF };
                } else {
                    // Si no hay código en el PDF, usar el código de la API
                    adventureLogger.code(`🗝️ Usando código de API para próximos manuscritos: "${apiCode}"`);
                    return { success: true, extractedCode: apiCode };
                }
            }

            return { success: true };

        } catch (timeoutError) {
            adventureLogger.error(`❌ Timeout esperando desbloqueo con código de API`, timeoutError);
            return { success: false };
        }
    }

    /**
     * Genera resumen de ejecución
     */
    generateExecutionSummary(
        pagesProcessed: number,
        totalManuscripts: number,
        executionTime: number,
        errors: string[] = []
    ): ExecutionSummary {
        const totalCodes = this.codigosObtenidos.PDFs.length + this.codigosObtenidos.APIs.length;

        return {
            PDFs: this.codigosObtenidos.PDFs,
            APIs: this.codigosObtenidos.APIs,
            totalCodigos: totalCodes,
            manuscritosProcesados: totalManuscripts,
            paginasRecorridas: pagesProcessed,
            tiempoEjecucion: executionTime,
            errores: errors
        };
    }

    /**
     * Limpia los códigos obtenidos (para nuevo procesamiento)
     */
    resetCodesTracking(): void {
        this.codigosObtenidos = {
            PDFs: [],
            APIs: []
        };
    }

    /**
     * Obtiene el resumen actual de códigos
     */
    getCurrentCodesSummary(): { PDFs: CodeResult[]; APIs: CodeResult[] } {
        return {
            PDFs: [...this.codigosObtenidos.PDFs],
            APIs: [...this.codigosObtenidos.APIs]
        };
    }
}