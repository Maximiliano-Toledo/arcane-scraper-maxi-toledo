import { BrowserService } from './browser.service';
import { SELECTORS } from '@/constants';
import { PaginationResult } from '@/types';
import { adventureLogger } from '@/utils/logger';

export class PaginationService {
    constructor(private browserService: BrowserService) {}

    /**
     * Busca la siguiente página disponible
     */
    async findNextPage(currentPage: number): Promise<PaginationResult> {
        try {
            adventureLogger.pagination(`🔍 Buscando siguiente página desde página ${currentPage}...`);

            // Buscar el contenedor de paginación
            const contenedorPaginacion = await this.browserService.getElement(SELECTORS.PAGINATION.CONTAINER);

            if (!contenedorPaginacion) {
                adventureLogger.pagination(`❌ No se encontró contenedor de paginación`);
                return { hasNextPage: false, currentPage };
            }

            // Buscar todos los botones de paginación
            const botonesPaginacion = await contenedorPaginacion.$$(SELECTORS.PAGINATION.BUTTONS);

            if (!botonesPaginacion || botonesPaginacion.length === 0) {
                adventureLogger.pagination(`❌ No se encontraron botones de paginación`);
                return { hasNextPage: false, currentPage };
            }

            adventureLogger.pagination(`📋 Analizando ${botonesPaginacion.length} botones de paginación:`);

            // Analizar cada botón para encontrar el siguiente
            for (let i = 0; i < botonesPaginacion.length; i++) {
                const boton = botonesPaginacion[i];

                if (!boton) continue;

                const texto = await boton.textContent();
                const clases = await boton.evaluate(el => el.className);

                adventureLogger.debug(`🔍 Botón ${i + 1}: "${texto}", clases: "${clases}"`);

                // Verificar si es el botón activo (página actual)
                const esActivo = this.isActiveButton(clases);

                // Buscar el siguiente número de página
                const numeroPagina = parseInt(texto?.trim() || '0');

                if (!isNaN(numeroPagina) && numeroPagina > currentPage && !esActivo) {
                    adventureLogger.success(`✅ Encontrado botón para página ${numeroPagina}`);
                    return {
                        hasNextPage: true,
                        nextPageButton: boton,
                        currentPage: numeroPagina
                    };
                }
            }

            adventureLogger.pagination(`❌ No se encontró botón válido para página siguiente a ${currentPage}`);
            return { hasNextPage: false, currentPage };

        } catch (error) {
            adventureLogger.error(`❌ Error buscando siguiente página`, error);
            return { hasNextPage: false, currentPage };
        }
    }

    /**
     * Navega a la siguiente página
     */
    async navigateToNextPage(currentPage: number): Promise<{ success: boolean; newPage: number }> {
        const paginationResult = await this.findNextPage(currentPage);

        if (!paginationResult.hasNextPage || !paginationResult.nextPageButton) {
            return { success: false, newPage: currentPage };
        }

        try {
            const nextPageNumber = paginationResult.currentPage;

            adventureLogger.pagination(`➡️ Navegando a la página ${nextPageNumber}...`);

            // Click en el botón de siguiente página
            await paginationResult.nextPageButton.click();

            // Esperar a que la página se cargue
            await this.browserService.waitForNavigation();

            adventureLogger.success(`📄 Ahora en página ${nextPageNumber}`);

            return { success: true, newPage: nextPageNumber };

        } catch (error) {
            adventureLogger.error(`Error navegando a la siguiente página`, error);
            return { success: false, newPage: currentPage };
        }
    }

    /**
     * Verifica si hay páginas disponibles sin navegar
     */
    async hasMorePages(currentPage: number): Promise<boolean> {
        const result = await this.findNextPage(currentPage);
        return result.hasNextPage;
    }

    /**
     * Obtiene información de todas las páginas disponibles
     */
    async getAllAvailablePages(): Promise<number[]> {
        try {
            const contenedorPaginacion = await this.browserService.getElement(SELECTORS.PAGINATION.CONTAINER);

            if (!contenedorPaginacion) {
                return [];
            }

            const botonesPaginacion = await contenedorPaginacion.$$(SELECTORS.PAGINATION.BUTTONS);
            const paginas: number[] = [];

            for (const boton of botonesPaginacion) {
                const texto = await boton.textContent();
                const numeroPagina = parseInt(texto?.trim() || '0');

                if (!isNaN(numeroPagina) && numeroPagina > 0) {
                    paginas.push(numeroPagina);
                }
            }

            // Ordenar y remover duplicados
            const paginasUnicas = [...new Set(paginas)].sort((a, b) => a - b);

            adventureLogger.pagination(`📋 Páginas disponibles: [${paginasUnicas.join(', ')}]`);

            return paginasUnicas;

        } catch (error) {
            adventureLogger.error('Error obteniendo páginas disponibles', error);
            return [];
        }
    }

    /**
     * Verifica si un botón está activo (página actual)
     */
    private isActiveButton(clases: string): boolean {
        return SELECTORS.PAGINATION.ACTIVE_CLASSES.some(activeClass =>
            clases.includes(activeClass)
        );
    }

    /**
     * Navega directamente a una página específica
     */
    async navigateToPage(targetPage: number): Promise<{ success: boolean; currentPage: number }> {
        try {
            const contenedorPaginacion = await this.browserService.getElement(SELECTORS.PAGINATION.CONTAINER);

            if (!contenedorPaginacion) {
                return { success: false, currentPage: 1 };
            }

            const botonesPaginacion = await contenedorPaginacion.$$(SELECTORS.PAGINATION.BUTTONS);

            for (const boton of botonesPaginacion) {
                const texto = await boton.textContent();
                const numeroPagina = parseInt(texto?.trim() || '0');

                if (numeroPagina === targetPage) {
                    adventureLogger.pagination(`➡️ Navegando directamente a página ${targetPage}...`);

                    await boton.click();
                    await this.browserService.waitForNavigation();

                    adventureLogger.success(`📄 Navegación exitosa a página ${targetPage}`);
                    return { success: true, currentPage: targetPage };
                }
            }

            adventureLogger.error(`❌ No se encontró botón para página ${targetPage}`);
            return { success: false, currentPage: 1 };

        } catch (error) {
            adventureLogger.error(`Error navegando a página ${targetPage}`, error);
            return { success: false, currentPage: 1 };
        }
    }

    /**
     * Obtiene el número de página actual
     */
    async getCurrentPageNumber(): Promise<number> {
        try {
            const contenedorPaginacion = await this.browserService.getElement(SELECTORS.PAGINATION.CONTAINER);

            if (!contenedorPaginacion) {
                return 1;
            }

            const botonesPaginacion = await contenedorPaginacion.$$(SELECTORS.PAGINATION.BUTTONS);

            for (const boton of botonesPaginacion) {
                const texto = await boton.textContent();
                const clases = await boton.evaluate(el => el.className);

                if (this.isActiveButton(clases)) {
                    const numeroPagina = parseInt(texto?.trim() || '1');
                    if (!isNaN(numeroPagina)) {
                        return numeroPagina;
                    }
                }
            }

            return 1; // Default a página 1 si no se puede determinar

        } catch (error) {
            adventureLogger.error('Error obteniendo número de página actual', error);
            return 1;
        }
    }

    /**
     * Verifica si estamos en la primera página
     */
    async isFirstPage(): Promise<boolean> {
        const currentPage = await this.getCurrentPageNumber();
        return currentPage === 1;
    }

    /**
     * Verifica si estamos en la última página
     */
    async isLastPage(): Promise<boolean> {
        const currentPage = await this.getCurrentPageNumber();
        const hasNext = await this.hasMorePages(currentPage);
        return !hasNext;
    }
}