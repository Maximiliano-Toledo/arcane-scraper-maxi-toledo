import { readFileSync, existsSync, statSync } from 'fs-extra';
import pdfParse from 'pdf-parse';
import { PDF_EXTRACTION_STRATEGIES } from '@/constants';
import { PDFExtractionStrategy } from '@/types';
import { searchCodeInText, extractPostScriptText, isValidCode } from '@/utils/helpers';
import { adventureLogger } from '@/utils/logger';

export class PDFService {
    /**
     * Extrae código de acceso desde un archivo PDF
     */
    async extractCodeFromPDF(pathPDF: string): Promise<string | null> {
        try {
            if (!existsSync(pathPDF)) {
                throw new Error('Archivo PDF no existe');
            }

            const stats = statSync(pathPDF);
            adventureLogger.manuscript(`📄 Analizando PDF: ${pathPDF} (${stats.size} bytes)`);

            if (stats.size < 500) {
                throw new Error(`Archivo PDF demasiado pequeño: ${stats.size} bytes`);
            }

            const buffer = readFileSync(pathPDF);

            // Intentar múltiples estrategias de parsing para PDFs problemáticos
            let textoExtraido: string | null = null;
            let estrategiaExitosa: string | null = null;

            for (const estrategia of PDF_EXTRACTION_STRATEGIES) {
                try {
                    adventureLogger.strategy(`🔧 Intentando extracción con estrategia: ${estrategia.nombre}`);

                    const data = await pdfParse(buffer, estrategia.opciones);

                    if (data && data.text && data.text.length > 10) {
                        textoExtraido = data.text;
                        estrategiaExitosa = estrategia.nombre;
                        adventureLogger.success(`✅ Extracción exitosa con estrategia: ${estrategia.nombre}`);
                        adventureLogger.strategy(`📊 Texto extraído: ${data.text.length} caracteres`);
                        break;
                    }
                } catch (strategyError) {
                    adventureLogger.error(`❌ Estrategia ${estrategia.nombre} falló`, strategyError);
                    continue;
                }
            }

            // Si falló la extracción normal, intentar con texto plano
            if (!textoExtraido) {
                adventureLogger.warning(`🆘 Todas las estrategias de PDF fallaron, intentando extracción de texto plano...`);
                const textoPlano = buffer.toString('utf8');

                // Extraer texto entre paréntesis del código PostScript
                const textoPostScript = extractPostScriptText(textoPlano);

                if (textoPostScript) {
                    adventureLogger.strategy(`📖 Texto extraído del PostScript: "${textoPostScript}"`);

                    // Buscar códigos en este texto
                    const codigoEncontrado = searchCodeInText(textoPostScript);
                    if (codigoEncontrado && isValidCode(codigoEncontrado)) {
                        adventureLogger.code(`🔑 ¡CÓDIGO EXTRAÍDO DEL TEXTO PLANO!: "${codigoEncontrado}"`);
                        adventureLogger.strategy(`🔧 Estrategia exitosa: extracción PostScript`);
                        return codigoEncontrado;
                    }
                }

                // Último intento: buscar directamente en todo el texto plano
                adventureLogger.strategy(`🔍 Buscando códigos en todo el contenido del archivo...`);
                const codigoEnTextoCompleto = searchCodeInText(textoPlano);
                if (codigoEnTextoCompleto && isValidCode(codigoEnTextoCompleto)) {
                    adventureLogger.code(`🔑 ¡CÓDIGO ENCONTRADO EN TEXTO COMPLETO!: "${codigoEnTextoCompleto}"`);
                    return codigoEnTextoCompleto;
                }

                throw new Error('No se pudo extraer texto con ninguna estrategia');
            }

            // Log del texto extraído (primeros 800 caracteres)
            const textoMuestra = textoExtraido.substring(0, 800);
            adventureLogger.manuscript(`📖 Texto extraído (primeros 800 caracteres):`);
            adventureLogger.debug(`"${textoMuestra}..."`);

            // Buscar código en el texto extraído normalmente
            const codigoEncontrado = searchCodeInText(textoExtraido);
            if (codigoEncontrado && isValidCode(codigoEncontrado)) {
                adventureLogger.code(`🔑 ¡CÓDIGO EXTRAÍDO EXITOSAMENTE!: "${codigoEncontrado}"`);
                adventureLogger.strategy(`🔧 Estrategia exitosa: ${estrategiaExitosa}`);
                return codigoEncontrado;
            }

            adventureLogger.warning(`⚠️ No se encontró código en el PDF con ningún patrón conocido`);
            return null;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            adventureLogger.error(`❌ Error al extraer código del PDF: ${errorMessage}`, err);
            return null;
        }
    }

    /**
     * Valida que un PDF sea válido y tenga contenido
     */
    validatePDF(pathPDF: string): { isValid: boolean; error?: string; size?: number } {
        try {
            if (!existsSync(pathPDF)) {
                return { isValid: false, error: 'Archivo no existe' };
            }

            const stats = statSync(pathPDF);

            if (stats.size < 500) {
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
     * Lista todas las estrategias de extracción disponibles
     */
    getAvailableStrategies(): PDFExtractionStrategy[] {
        return [...PDF_EXTRACTION_STRATEGIES];
    }

    /**
     * Extrae texto usando una estrategia específica
     */
    async extractTextWithStrategy(
        pathPDF: string,
        strategy: PDFExtractionStrategy
    ): Promise<string | null> {
        try {
            const buffer = readFileSync(pathPDF);
            const data = await pdfParse(buffer, strategy.opciones);
            return data.text || null;
        } catch (error) {
            adventureLogger.error(`Error con estrategia ${strategy.nombre}`, error);
            return null;
        }
    }

    /**
     * Obtiene metadatos del PDF
     */
    async getPDFMetadata(pathPDF: string): Promise<Record<string, any> | null> {
        try {
            const buffer = readFileSync(pathPDF);
            const data = await pdfParse(buffer);

            return {
                numpages: data.numpages,
                numrender: data.numrender,
                info: data.info,
                metadata: data.metadata,
                version: data.version
            };
        } catch (error) {
            adventureLogger.error('Error obteniendo metadatos del PDF', error);
            return null;
        }
    }
}