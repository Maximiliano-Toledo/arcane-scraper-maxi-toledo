import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['cjs'],
    clean: true,
    sourcemap: true,
    dts: false,
    esbuildOptions(options) {
        options.alias = {
            '@': './src'
        }
    }
})
