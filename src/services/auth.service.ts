import { BrowserService } from './browser.service';
import { appConfig } from '@/config/app.config';
import { SELECTORS, TIMEOUTS } from '@/constants';
import { createSafeWaitOptions, createSafeNavigationOptions } from '@/utils/types';
import { adventureLogger } from '@/utils/logger';

export class AuthService {
    constructor(private browserService: BrowserService) {}

    /**
     * Realiza el proceso completo de autenticación
     */
    async login(): Promise<void> {
        try {
            await this.navigateToLoginPage();
            await this.fillCredentials();
            await this.submitLogin();
            await this.verifyLogin();

            adventureLogger.success('✅ ¡Login exitoso! Acceso a la cripta concedido');
        } catch (error) {
            adventureLogger.error('Error durante el proceso de login', error);
            throw error;
        }
    }

    /**
     * Navega a la página de login
     */
    private async navigateToLoginPage(): Promise<void> {
        adventureLogger.portal('🚪 Navegando al portal de la cripta...');
        await this.browserService.navigateTo(appConfig.app.url);
    }

    /**
     * Llena las credenciales de acceso
     */
    private async fillCredentials(): Promise<void> {
        adventureLogger.portal('🔐 Ingresando credenciales místicas...');

        const page = this.browserService.getPage();

        // Llenar email
        await this.browserService.fillInput(
            SELECTORS.LOGIN.EMAIL_INPUT,
            appConfig.auth.email
        );

        // Llenar password
        await this.browserService.fillInput(
            SELECTORS.LOGIN.PASSWORD_INPUT,
            appConfig.auth.password
        );

        adventureLogger.debug('Credenciales ingresadas', {
            email: appConfig.auth.email,
            passwordLength: appConfig.auth.password.length
        });
    }

    /**
     * Envía el formulario de login
     */
    private async submitLogin(): Promise<void> {
        adventureLogger.portal('🔑 Activando hechizo de acceso...');

        const page = this.browserService.getPage();
        const navigationOptions = createSafeNavigationOptions('networkidle', TIMEOUTS.NAVIGATION);

        // Hacer click en el botón de submit y esperar navegación
        await Promise.all([
            page.waitForNavigation(navigationOptions),
            this.browserService.click(SELECTORS.LOGIN.SUBMIT_BUTTON)
        ]);
    }

    /**
     * Verifica que el login fue exitoso
     */
    private async verifyLogin(): Promise<void> {
        adventureLogger.portal('🔍 Verificando acceso al reino sagrado...');

        try {
            await this.browserService.waitForSelector(
                SELECTORS.LOGIN.SUCCESS_INDICATOR,
                TIMEOUTS.NAVIGATION
            );

            const successElement = await this.browserService.getElement(SELECTORS.LOGIN.SUCCESS_INDICATOR);

            if (!successElement) {
                throw new Error('No se encontró el indicador de login exitoso');
            }

            const pageTitle = await this.browserService.getTextContent(SELECTORS.LOGIN.SUCCESS_INDICATOR);

            adventureLogger.success('Portal de acceso validado', {
                pageTitle: pageTitle?.trim()
            });

        } catch (error) {
            throw new Error(`Login fallido: ${error instanceof Error ? error.message : 'Selector posterior al login no encontrado'}`);
        }
    }

    /**
     * Verifica si ya está autenticado
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const successElement = await this.browserService.getElement(SELECTORS.LOGIN.SUCCESS_INDICATOR);
            return successElement !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Cierra sesión (si es necesario)
     */
    async logout(): Promise<void> {
        // Implementar si hay un botón de logout en la aplicación
        adventureLogger.portal('🚪 Cerrando sesión...');
        // Por ahora no hay logout en el challenge original
    }
}