import React from "react";
import { createInjector } from "..";
import { InjectorProvider } from "../InjectorProvider";

export function createTestInjectorProvider(
  Wrapper?: React.FC<{ children: React.ReactNode }>,
) {
  const injector = createInjector();
  const getInjector = () => injector;
  const TestInjectorProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    if (Wrapper) {
      return (
        <Wrapper>
          <InjectorProvider value={getInjector}>{children}</InjectorProvider>
        </Wrapper>
      );
    }
    return <InjectorProvider value={getInjector}>{children}</InjectorProvider>;
  };

  return TestInjectorProvider;
}
