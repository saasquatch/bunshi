import React from "react";
import { createInjector } from "../";
import { InjectorProvider } from "../InjectorProvider";


export function createTestInjectorProvider() {

    const injector = createInjector();

    const TestInjectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return <InjectorProvider value={injector}>
            {children}
        </InjectorProvider>
    }

    return TestInjectorProvider;
}