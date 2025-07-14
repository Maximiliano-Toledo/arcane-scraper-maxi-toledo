import axios, { AxiosResponse } from 'axios';
import { appConfig } from '@/config/app.config';
import { APIResponse, APIChallenge } from '@/types';
import { resolveBinarySearchChallenge, isValidCode } from '@/utils/helpers';
import { adventureLogger } from '@/utils/logger';

export class APIService {
    private baseURL: string;
    private timeout: number;

    constructor() {
        this.baseURL = appConfig.api.baseUrl;
        this.timeout = appConfig.api.timeout;
    }

    /**
     * Obtiene código desde la API externa resolviendo desafíos
     */
    async getCodeFromAPI(bookTitle: string, unlockCode: string): Promise<string | null> {
        try {
            adventureLogger.api(`🌐 Solicitando API para bookTitle: "${bookTitle}", con código: "${unlockCode}"`);

            const response = await this.makeAPIRequest(bookTitle, unlockCode);

            if (!response) {
                return null;
            }

            adventureLogger.api(`📡 Respuesta de API recibida:`);
            adventureLogger.debug(JSON.stringify(response.data, null, 2));

            // Verificar si hay un desafío de búsqueda binaria
            if (this.hasBinarySearchChallenge(response.data)) {
                adventureLogger.api(`🧩 Desafío detectado: búsqueda binaria`);
                return await this.solveBinarySearchChallenge(response.data);
            } else {
                // Respuesta simple con código directo
                return this.extractDirectCode(response.data);
            }

        } catch (error) {
            adventureLogger.error('Error en llamada a API', error);
            return null;
        }
    }

    /**
     * Realiza la llamada HTTP a la API
     */
    private async makeAPIRequest(bookTitle: string, unlockCode: string): Promise<AxiosResponse<APIResponse> | null> {
        try {
            const url = `${this.baseURL}/api/cipher/challenge`;

            const response = await axios.get<APIResponse>(url, {
                params: { bookTitle, unlockCode },
                timeout: this.timeout,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Sherpa-Manuscript-Automation/1.0'
                }
            });

            return response;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                adventureLogger.error(`Error HTTP en API`, error, {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url
                });
            } else {
                adventureLogger.error('Error desconocido en API', error);
            }
            return null;
        }
    }

    /**
     * Verifica si la respuesta contiene un desafío de búsqueda binaria
     */
    private hasBinarySearchChallenge(data: APIResponse): boolean {
        return !!(data.challenge && data.challenge.vault && data.challenge.targets);
    }

    /**
     * Resuelve el desafío de búsqueda binaria
     */
    private async solveBinarySearchChallenge(data: APIResponse): Promise<string | null> {
        if (!data.challenge) {
            return null;
        }

        const { vault, targets } = data.challenge;

        adventureLogger.api(`🧮 Resolviendo desafío de búsqueda binaria:`);
        adventureLogger.debug(`📦 Vault: [${vault.slice(0, 5).join(', ')}...] (${vault.length} elementos)`);
        adventureLogger.debug(`🎯 Targets: [${targets.join(', ')}]`);

        const contraseña = resolveBinarySearchChallenge(vault, targets);

        if (contraseña && isValidCode(contraseña)) {
            adventureLogger.code(`🔑 ¡DESAFÍO RESUELTO! Contraseña: "${contraseña}"`);
            return contraseña;
        } else {
            adventureLogger.error('No se pudo resolver el desafío de búsqueda binaria');
            return null;
        }
    }

    /**
     * Extrae código directo de la respuesta de la API
     */
    private extractDirectCode(data: APIResponse): string | null {
        const codigo = data.codigo || data.code || (typeof data === 'string' ? data : null);

        if (!codigo || typeof codigo !== 'string') {
            adventureLogger.error(`API no devolvió código válido. Respuesta: ${JSON.stringify(data)}`);
            return null;
        }

        if (!isValidCode(codigo)) {
            adventureLogger.error(`Código recibido no es válido: "${codigo}"`);
            return null;
        }

        adventureLogger.code(`🔑 ¡CÓDIGO DIRECTO DE API!: "${codigo}"`);
        return codigo;
    }

    /**
     * Verifica el estado de la API
     */
    async checkAPIHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            adventureLogger.warning('API no disponible o sin endpoint de health');
            return false;
        }
    }

    /**
     * Realiza una llamada de prueba a la API
     */
    async testAPI(): Promise<{ success: boolean; response?: any; error?: string }> {
        try {
            const testResponse = await this.makeAPIRequest('TEST_BOOK', 'TEST_CODE');

            if (testResponse) {
                return {
                    success: true,
                    response: testResponse.data
                };
            } else {
                return {
                    success: false,
                    error: 'No se recibió respuesta de la API'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Configura un timeout personalizado
     */
    setTimeout(timeout: number): void {
        this.timeout = timeout;
        adventureLogger.api(`Timeout de API configurado a ${timeout}ms`);
    }

    /**
     * Obtiene la configuración actual
     */
    getConfig(): { baseURL: string; timeout: number } {
        return {
            baseURL: this.baseURL,
            timeout: this.timeout
        };
    }
}