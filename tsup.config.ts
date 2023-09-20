import { defineConfig } from "tsup";

export default defineConfig({
    // Outputs `dist/foo.js` and `dist/bar.js`
    entry: {
        vanilla: 'src/vanilla/index.ts',
        react: 'src/react/index.ts',
        vue: 'src/vue/index.ts',
    },
    format: [
        "cjs", "esm"
    ],
    // Cleanup dist on builds
    clean: true
})