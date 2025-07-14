import { config } from 'dotenv';
import { AppConfig } from '@/types';

// Cargar variables de entorno
config();

export const appConfig: AppConfig = {
    app: {
        url: process.env.URL || 'https://pruebatecnica-sherpa-production.up.railway.app/',
        maxPages: parseInt(process.env.MAX_PAGES || '5', 10),
        downloadPath: process.env.DOWNLOAD_PATH || './downloads',
        logPath: process.env.LOG_PATH || './logs'
    },
    auth: {
        email: process.env.EMAIL || 'monje@sherpa.local',
        password: process.env.PASSWORD || 'cript@123'
    },
    api: {
        baseUrl: process.env.API_URL || 'https://backend-production-9d875.up.railway.app',
        timeout: parseInt(process.env.API_TIMEOUT || '15000', 10)
    },
    browser: {
        headless: process.env.HEADLESS === 'true',
        viewport: {
            width: parseInt(process.env.BROWSER_WIDTH || '1280', 10),
            height: parseInt(process.env.BROWSER_HEIGHT || '720', 10)
        },
        slowMo: parseInt(process.env.SLOW_MO || '500', 10)
    }
};

export default appConfig;