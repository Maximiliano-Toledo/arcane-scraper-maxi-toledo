# 🏰 Manuscript Automation

> **Automatizador profesional para el desafío técnico de manuscritos sagrados**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

## 📋 Descripción

Una solución completa y profesional en TypeScript para automatizar la extracción de códigos de manuscritos sagrados del desafío técnico. Implementa arquitectura modular, logging avanzado y manejo robusto de errores.

## ✨ Características Principales

### 🎯 **Funcionalidades Core**
- ✅ **Autenticación automática** con credenciales configurables
- ✅ **Navegación multi-página** con detección inteligente de paginación
- ✅ **Clasificación automática** de 3 tipos de manuscritos
- ✅ **Extracción robusta de PDFs** con múltiples estrategias de parsing
- ✅ **Integración con APIs externas** y resolución de desafíos algorítmicos
- ✅ **Manejo de descargas** con reintentos automáticos

### 🔧 **Arquitectura Profesional**
- 📦 **Modular y escalable** con separación de responsabilidades
- 🎯 **TypeScript** con tipado estricto y inferencia avanzada
- 📝 **Logging temático** con Winston y rotación de archivos
- ⚡ **Manejo de errores** robusto con reintentos inteligentes
- 🧪 **Preparado para testing** con Jest y estructura modular

### 🛠️ **Tecnologías Utilizadas**
- **Playwright** - Automatización web moderna y confiable
- **TypeScript** - Desarrollo type-safe y mantenible
- **Winston** - Logging profesional con múltiples transportes
- **Axios** - Cliente HTTP para integración con APIs
- **pdf-parse** - Extracción de contenido de archivos PDF

## 🚀 Instalación y Configuración

### **Prerrequisitos**
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### **1. Clonación e instalación**
```bash
git clone <repository-url>
cd arcane-scraper-maxi-toledo
npm install
```

### **2. Configuración de entorno**
```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar variables según necesidades
nano .env
```

### **3. Instalación de browsers (Playwright)**
```bash
npx playwright install chromium
```

## 🎮 Uso

### **Ejecución en Desarrollo**
```bash
# Compilar y ejecutar
npm run dev

# Ejecutar con recarga automática
npm run dev:watch
```

### **Ejecución en Producción**
```bash
# Compilar proyecto
npm run build

# Ejecutar versión compilada
npm start
```

### **Comandos Adicionales**
```bash
# Linting y formato
npm run lint
npm run format

# Limpieza
npm run clean
```

## 📁 Estructura del Proyecto

```
sherpa-manuscript-automation/
├── 📄 package.json              # Configuración del proyecto
├── 📄 tsconfig.json             # Configuración TypeScript
├── 📄 .env.example              # Variables de entorno ejemplo
├── 📄 .gitignore                # Archivos a ignorar
├── 📄 README.md                 # Documentación
├── 📁 src/
│   ├── 📄 index.ts              # Punto de entrada principal
│   ├── 📁 config/
│   │   └── 📄 app.config.ts     # Configuración centralizada
│   ├── 📁 services/
│   │   ├── 📄 browser.service.ts      # Manejo de Playwright
│   │   ├── 📄 auth.service.ts         # Autenticación
│   │   ├── 📄 manuscript.service.ts   # Lógica principal
│   │   ├── 📄 pdf.service.ts          # Extracción de PDFs
│   │   ├── 📄 api.service.ts          # Integración APIs
│   │   ├── 📄 download.service.ts     # Gestión de descargas
│   │   └── 📄 pagination.service.ts   # Navegación páginas
│   ├── 📁 utils/
│   │   ├── 📄 logger.ts               # Sistema de logging
│   │   └── 📄 helpers.ts              # Utilidades generales
│   ├── 📁 types/
│   │   └── 📄 index.ts                # Definiciones TypeScript
│   └── 📁 constants/
│       └── 📄 index.ts                # Constantes y selectores
├── 📁 dist/                     # Código compilado
├── 📁 logs/                     # Archivos de log
└── 📁 downloads/                # PDFs descargados
```

## ⚙️ Configuración

### **Variables de Entorno Principales**

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `URL` | URL de la aplicación | `https://pruebatecnica-sherpa-production.up.railway.app/` |
| `EMAIL` | Email de autenticación | `monje@sherpa.local` |
| `PASSWORD` | Contraseña de acceso | `cript@123` |
| `MAX_PAGES` | Páginas máximas a procesar | `5` |
| `HEADLESS` | Modo headless del browser | `false` |
| `LOG_LEVEL` | Nivel de logging | `info` |

Ver `.env.example` para configuración completa.

```
# 🏰 Configuración Principal de Arcane Scraper

# ===========================================
# 🌐 CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================

# URL del sitio objetivo
URL=https://pruebatecnica-sherpa-production.up.railway.app/

# Número máximo de páginas a procesar
MAX_PAGES=5

# Directorios de trabajo
DOWNLOAD_PATH=./downloads
LOG_PATH=./logs

# ===========================================
# 🔐 CREDENCIALES DE ACCESO
# ===========================================

# Credenciales para autenticación
EMAIL=monje@sherpa.local
PASSWORD=cript@123

# ===========================================
# 🌐 CONFIGURACIÓN DE API EXTERNA
# ===========================================

# URL de la API para desafíos
API_URL=https://backend-production-9d875.up.railway.app
API_TIMEOUT=15000

# ===========================================
# 🔧 CONFIGURACIÓN DEL NAVEGADOR
# ===========================================

# Modo headless (true = sin ventana, false = con ventana)
HEADLESS=false

# Dimensiones del navegador
BROWSER_WIDTH=1280
BROWSER_HEIGHT=720

# Velocidad de ejecución (0 = máxima velocidad, 1000 = 1 segundo entre acciones)
SLOW_MO=500

# ===========================================
# 📝 CONFIGURACIÓN DE LOGGING
# ===========================================

# Nivel de logging (error, warn, info, debug)
LOG_LEVEL=info

# ===========================================
# ⏱️ TIMEOUTS Y REINTENTOS
# ===========================================

# Timeouts en milisegundos
DOWNLOAD_TIMEOUT=30000
MODAL_TIMEOUT=15000
NAVIGATION_TIMEOUT=10000
UNLOCK_TIMEOUT=10000

# Número máximo de reintentos
MAX_DOWNLOAD_ATTEMPTS=3
MAX_INPUT_ATTEMPTS=5
RETRY_DELAY=2000

```

## 🔧 Funcionalidades Técnicas

### **1. Tipos de Manuscritos Detectados**
- **🔓 Desbloqueado**: Con botón "Descargar PDF" disponible
- **🔒 Bloqueado**: Requiere código de acceso del manuscrito anterior
- **📖 Documentación**: Requiere consulta de API y resolución de algoritmos

### **2. Estrategias de Extracción de PDF**
- **Normal**: Parsing estándar con pdf-parse
- **Tolerante**: Con configuraciones flexibles para PDFs problemáticos
- **Legacy**: Para PDFs con formatos antiguos
- **PostScript**: Extracción directa del código fuente cuando falla el parsing

### **3. Algoritmos Implementados**
- **Búsqueda Binaria**: Para resolver desafíos de la API externa
- **Conversión de Números Romanos**: Para ordenamiento cronológico
- **Patrones Regex Avanzados**: Para extracción de códigos con múltiples formatos

### **4. Sistema de Logging**
```typescript
// Logging temático con emojis
adventureLogger.adventure('🏰 Mensaje de aventura');
adventureLogger.manuscript('📜 Procesando manuscrito');
adventureLogger.code('🔑 Código extraído');
adventureLogger.api('🌐 Llamada a API');
adventureLogger.error('❌ Error encontrado');
```

## 📊 Salida y Resultados

### **Logging en Tiempo Real**
- 📄 **Consola**: Output colorizado con emojis temáticos
- 📁 **Archivos**: Logs estructurados en `./logs/`
- 🔄 **Rotación**: Archivos con límite de tamaño y retención

### **Resumen Final**
```
📊 ESTADÍSTICAS FINALES:
   📊 Total códigos obtenidos: 6 (4 de PDFs + 2 de APIs)
   📚 Manuscritos procesados: 6
   📄 Páginas recorridas: 2
   ⏱️ Tiempo de ejecución: 2m 45s
```

### **Archivos Generados**
- 📥 **PDFs**: Descargados en `./downloads/`
- 📝 **Logs**: Detallados en `./logs/aventura.log`
- ❌ **Errores**: Separados en `./logs/error.log`

## 🐛 Troubleshooting

### **Problemas Comunes**

**Error: Browser no se inicia**
```bash
# Reinstalar browsers
npx playwright install --force
```

**Error: No se encuentran manuscritos**
- Verificar que la URL sea correcta
- Comprobar credenciales en `.env`
- Revisar logs para errores de selectores

**Error: PDFs no se descargan**
- Verificar permisos del directorio `downloads/`
- Comprobar espacio en disco
- Revisar timeouts en configuración

### **Logs Útiles**
```bash
# Ver logs en tiempo real
tail -f logs/aventura.log

# Ver solo errores
tail -f logs/error.log

# Buscar en logs
grep "ERROR" logs/aventura.log
```



## 👥 Autor

Desarrollado para desafío técnico - Automatización de Manuscritos Sagrados.

---

**🎭 "Recuerda, noble guerrero: Solo el código puro puede conquistar la cripta digital."** ⚔️🏴‍☠️