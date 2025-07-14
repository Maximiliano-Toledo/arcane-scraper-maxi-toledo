import winston from 'winston';
import { existsSync, mkdirSync } from 'fs-extra';
import path from 'path';
import { appConfig } from '@/config/app.config';

// Crear directorio de logs si no existe
const logDir = appConfig.app.logPath;
if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para los logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Formato para consola
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const emoji = getLogEmoji(level);
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${emoji} [${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

function getLogEmoji(level: string): string {
    const emojis: Record<string, string> = {
        error: '❌',
        warn: '⚠️',
        info: '📄',
        debug: '🔍',
        verbose: '📝'
    };
    return emojis[level] || '📋';
}

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'sherpa-manuscript-automation' },
    transports: [
        // Archivo para errores
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Archivo para logs generales
        new winston.transports.File({
            filename: path.join(logDir, 'aventura.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Consola
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

// Clase Logger con métodos temáticos
export class AdventureLogger {
    private startTime: number;

    constructor() {
        this.startTime = Date.now();
    }

    // Logs con emojis temáticos
    adventure(message: string, meta?: object): void {
        logger.info(`🏰 ${message}`, meta);
    }

    portal(message: string, meta?: object): void {
        logger.info(`🚪 ${message}`, meta);
    }

    manuscript(message: string, meta?: object): void {
        logger.info(`📜 ${message}`, meta);
    }

    code(message: string, meta?: object): void {
        logger.info(`🔑 ${message}`, meta);
    }

    api(message: string, meta?: object): void {
        logger.info(`🌐 ${message}`, meta);
    }

    download(message: string, meta?: object): void {
        logger.info(`📥 ${message}`, meta);
    }

    success(message: string, meta?: object): void {
        logger.info(`✅ ${message}`, meta);
    }

    error(message: string, error?: Error | string | unknown, meta?: object): void {
        let errorMeta: object;

        if (error instanceof Error) {
            errorMeta = { ...meta, error: error.message, stack: error.stack };
        } else if (typeof error === 'string') {
            errorMeta = { ...meta, error };
        } else if (error !== undefined) {
            errorMeta = { ...meta, error: String(error) };
        } else {
            errorMeta = { ...meta };
        }

        logger.error(`❌ ${message}`, errorMeta);
    }

    warning(message: string, meta?: object): void {
        logger.warn(`⚠️ ${message}`, meta);
    }

    debug(message: string, meta?: object): void {
        logger.debug(`🔍 ${message}`, meta);
    }

    summary(message: string, meta?: object): void {
        logger.info(`📊 ${message}`, meta);
    }

    strategy(message: string, meta?: object): void {
        logger.info(`🔧 ${message}`, meta);
    }

    pagination(message: string, meta?: object): void {
        logger.info(`📄 ${message}`, meta);
    }

    // Métodos de tiempo
    startTimer(): number {
        this.startTime = Date.now();
        return this.startTime;
    }

    getElapsedTime(): number {
        return Date.now() - this.startTime;
    }

    logElapsedTime(action: string): void {
        const elapsed = this.getElapsedTime();
        this.summary(`${action} completado en ${elapsed}ms`);
    }

    // Separadores visuales
    separator(): void {
        logger.info('========================================');
    }

    bigSeparator(): void {
        logger.info('🏰 ============================================');
        logger.info('🏰 INICIANDO LA AVENTURA DE LOS MANUSCRITOS');
        logger.info('🏰 ============================================');
    }

    endSeparator(): void {
        logger.info('🎉 ============================================');
        logger.info('🎉 ¡AVENTURA COMPLETADA EXITOSAMENTE!');
        logger.info('🎉 ¡Todos los manuscritos han sido conquistados!');
        logger.info('🎉 ============================================');
    }
}

// Instancia singleton
export const adventureLogger = new AdventureLogger();

// Export del logger base para casos especiales
export { logger };

export default adventureLogger;