import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { appConfig } from '@/config/app.config';
import { BrowserOptions } from '@/types';
import { createSafeWaitOptions } from '@/utils/types';
import { adventureLogger } from '@/utils/logger';

export class BrowserService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    /**
     * Inicializa el browser con la configuración especificada
     */
    async initialize(options?: Partial<BrowserOptions>): Promise<void> {
        try {
            const browserOptions = {
                ...appConfig.browser,
                ...options
            };

            adventureLogger.adventure('Invocando el portal místico del browser...');

            this.browser = await chromium.launch({
                headless: browserOptions.headless,
                slowMo: browserOptions.slowMo
            });

            this.context = await this.browser.newContext({
                acceptDownloads: true,
                viewport: browserOptions.viewport
            });

            this.page = await this.context.newPage();

            adventureLogger.success('Browser inicializado correctamente', {
                headless: browserOptions.headless,
                viewport: browserOptions.viewport
            });

        } catch (error) {
            adventureLogger.error('Error al inicializar el browser', error);
            throw error;
        }
    }

    /**
     * Obtiene la página actual
     */
    getPage(): Page {
        if (!this.page) {
            throw new Error('Browser no inicializado. Llama a initialize() primero.');
        }
        return this.page;
    }

    /**
     * Obtiene el contexto del browser
     */
    getContext(): BrowserContext {
        if (!this.context) {
            throw new Error('Browser no inicializado. Llama a initialize() primero.');
        }
        return this.context;
    }

    /**
     * Navega a una URL específica
     */
    async navigateTo(url: string): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            adventureLogger.portal(`Navegando al portal: ${url}`);
            await this.page.goto(url, { waitUntil: 'networkidle' });
            adventureLogger.success(`Navegación exitosa a: ${url}`);
        } catch (error) {
            adventureLogger.error(`Error al navegar a ${url}`, error);
            throw error;
        }
    }

    /**
     * Espera por un selector específico
     */
    async waitForSelector(selector: string, timeout?: number): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            const waitOptions = createSafeWaitOptions(timeout);
            await this.page.waitForSelector(selector, waitOptions);
            adventureLogger.debug(`Selector encontrado: ${selector}`);
        } catch (error) {
            adventureLogger.error(`Timeout esperando selector: ${selector}`, error);
            throw error;
        }
    }

    /**
     * Llena un campo de input
     */
    async fillInput(selector: string, value: string): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            await this.page.fill(selector, value);
            adventureLogger.debug(`Campo llenado: ${selector}`);
        } catch (error) {
            adventureLogger.error(`Error llenando campo ${selector}`, error);
            throw error;
        }
    }

    /**
     * Hace click en un elemento
     */
    async click(selector: string): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            await this.page.click(selector);
            adventureLogger.debug(`Click realizado en: ${selector}`);
        } catch (error) {
            adventureLogger.error(`Error haciendo click en ${selector}`, error);
            throw error;
        }
    }

    /**
     * Espera por navegación
     */
    async waitForNavigation(): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            await this.page.waitForLoadState('networkidle');
            adventureLogger.debug('Navegación completada');
        } catch (error) {
            adventureLogger.error('Error esperando navegación', error);
            throw error;
        }
    }

    /**
     * Obtiene el contenido de texto de un elemento
     */
    async getTextContent(selector: string): Promise<string | null> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            const content = await this.page.textContent(selector);
            return content;
        } catch (error) {
            adventureLogger.error(`Error obteniendo texto de ${selector}`, error);
            return null;
        }
    }

    /**
     * Obtiene todos los elementos que coinciden con un selector
     */
    async getAllElements(selector: string) {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            return await this.page.$$(selector);
        } catch (error) {
            adventureLogger.error(`Error obteniendo elementos ${selector}`, error);
            return [];
        }
    }

    /**
     * Obtiene un elemento específico
     */
    async getElement(selector: string) {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            return await this.page.$(selector);
        } catch (error) {
            adventureLogger.error(`Error obteniendo elemento ${selector}`, error);
            return null;
        }
    }

    /**
     * Presiona una tecla
     */
    async pressKey(key: string): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            await this.page.keyboard.press(key);
            adventureLogger.debug(`Tecla presionada: ${key}`);
        } catch (error) {
            adventureLogger.error(`Error presionando tecla ${key}`, error);
            throw error;
        }
    }

    /**
     * Espera un tiempo específico
     */
    async wait(ms: number): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        await this.page.waitForTimeout(ms);
        adventureLogger.debug(`Esperando ${ms}ms`);
    }

    /**
     * Toma una captura de pantalla
     */
    async screenshot(path: string): Promise<void> {
        if (!this.page) {
            throw new Error('Browser no inicializado.');
        }

        try {
            await this.page.screenshot({ path, fullPage: true });
            adventureLogger.debug(`Screenshot guardado en: ${path}`);
        } catch (error) {
            adventureLogger.error(`Error tomando screenshot`, error);
            throw error;
        }
    }

    /**
     * Cierra el browser
     */
    async close(): Promise<void> {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }

            if (this.context) {
                await this.context.close();
                this.context = null;
            }

            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }

            adventureLogger.adventure('🔒 Portal místico cerrado. Fin de la aventura.');
        } catch (error) {
            adventureLogger.error('Error cerrando browser', error);
            throw error;
        }
    }

    /**
     * Verifica si el browser está inicializado
     */
    isInitialized(): boolean {
        return this.browser !== null && this.context !== null && this.page !== null;
    }
}