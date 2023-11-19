import React from "react";
import { createInjector } from "..";
import { InjectorProvider } from "../InjectorProvider";

export function createTestInjectorProvider(
  Wrapper?: React.FC<{ children: React.ReactNode }>
) {
  const injector = createInjector();

  const TestInjectorProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    if (Wrapper) {
      return (
        <Wrapper>
          <InjectorProvider value={injector}>{children}</InjectorProvider>
        </Wrapper>
      );
    }
    return <InjectorProvider value={injector}>{children}</InjectorProvider>;
  };

  return TestInjectorProvider;
}
