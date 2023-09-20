// test-utils.js
import { createApp, shallowRef } from 'vue';

// Source: https://vuejs.org/guide/scaling-up/testing.html#recipes
export function withSetup<T>(composable: () => T) {
    let result = shallowRef<T | undefined>(undefined);
    const app = createApp({
        setup() {
            result.value = composable()
            // suppress missing template warning
            return () => { }
        },

    })
    const mount = () => app.mount(document.createElement('div'))
    // return the result and the app instance
    // for testing provide / unmount
    return [result!, mount, app] as const;
}