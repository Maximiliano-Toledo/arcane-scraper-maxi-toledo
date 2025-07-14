module.exports = {
    // Ancho máximo de línea
    printWidth: 100,

    // Número de espacios por nivel de indentación
    tabWidth: 2,

    // Usar espacios en lugar de tabs
    useTabs: false,

    // Punto y coma al final de las declaraciones
    semi: true,

    // Usar comillas simples
    singleQuote: true,

    // Comillas en propiedades de objetos solo cuando sea necesario
    quoteProps: 'as-needed',

    // Usar comillas simples en JSX
    jsxSingleQuote: true,

    // Comas finales donde sea válido en ES5 (objetos, arrays, etc.)
    trailingComma: 'es5',

    // Espacios dentro de llaves de objetos
    bracketSpacing: true,

    // Poner > de elementos JSX en la misma línea
    bracketSameLine: false,

    // Incluir paréntesis alrededor de parámetros de arrow functions
    arrowParens: 'avoid',

    // Formatear todo el archivo
    rangeStart: 0,
    rangeEnd: Infinity,

    // No requerir pragma
    requirePragma: false,

    // No insertar pragma
    insertPragma: false,

    // Usar configuración por defecto para prose wrap
    proseWrap: 'preserve',

    // Configuración específica para HTML
    htmlWhitespaceSensitivity: 'css',

    // Configuración para Vue SFC
    vueIndentScriptAndStyle: false,

    // Fin de línea LF
    endOfLine: 'lf',

    // Configuración específica para tipos de archivo
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,
                printWidth: 80
            }
        },
        {
            files: '*.md',
            options: {
                proseWrap: 'always',
                printWidth: 80
            }
        },
        {
            files: '*.yaml',
            options: {
                tabWidth: 2,
                singleQuote: false
            }
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
                singleQuote: false
            }
        }
    ]
};