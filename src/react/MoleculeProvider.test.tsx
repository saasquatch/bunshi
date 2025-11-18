import { renderHook } from "@testing-library/react";
import React from "react";
import { molecule, moleculeInterface } from "../vanilla";
import { MoleculeProvider } from "./MoleculeProvider";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";
import { useInjector } from "./useInjector";

// Test molecules and interfaces
const NumberInterface = moleculeInterface<number>();
const StringInterface = moleculeInterface<string>();

const NumberMolecule = molecule(() => 42);
const AnotherNumberMolecule = molecule(() => 100);
const StringMolecule = molecule(() => "hello world");

strictModeSuite(({ wrapper: Outer }) => {
  describe("MoleculeProvider", () => {
    test("provides molecule interface implementation to children", () => {
      const TestComponent = () => {
        const number = useMolecule(NumberInterface);
        return { number };
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <MoleculeProvider
              interface={NumberInterface}
              value={NumberMolecule}
            >
              {children}
            </MoleculeProvider>
          </Outer>
        );
      };

      const { result } = renderHook(TestComponent, {
        wrapper: Wrapper,
      });

      expect(result.current.number).toBe(42);
    });

    test("provides different implementations for different interfaces", () => {
      const TestComponent = () => {
        const number = useMolecule(NumberInterface);
        const string = useMolecule(StringInterface);
        return { number, string };
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <MoleculeProvider
              interface={NumberInterface}
              value={NumberMolecule}
            >
              <MoleculeProvider
                interface={StringInterface}
                value={StringMolecule}
              >
                {children}
              </MoleculeProvider>
            </MoleculeProvider>
          </Outer>
        );
      };

      const { result } = renderHook(TestComponent, {
        wrapper: Wrapper,
      });

      expect(result.current.number).toBe(42);
      expect(result.current.string).toBe("hello world");
    });

    test("nested providers override parent implementations", () => {
      const TestComponent = () => {
        const number = useMolecule(NumberInterface);
        return { number };
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <MoleculeProvider
              interface={NumberInterface}
              value={NumberMolecule}
            >
              <MoleculeProvider
                interface={NumberInterface}
                value={AnotherNumberMolecule}
              >
                {children}
              </MoleculeProvider>
            </MoleculeProvider>
          </Outer>
        );
      };

      const { result } = renderHook(TestComponent, {
        wrapper: Wrapper,
      });

      expect(result.current.number).toBe(100);
    });

    test("provider without value prop should not provide interface", () => {
      const TestComponent = () => {
        const injector = useInjector();
        expect(() => {
          injector.get(NumberInterface);
        }).toThrowError(
          "Unbound molecule interface. Could not find a molecule.",
        );
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <MoleculeProvider interface={NumberInterface}>
              {children}
            </MoleculeProvider>
          </Outer>
        );
      };

      renderHook(TestComponent, {
        wrapper: Wrapper,
      });
    });

    test("provides molecule interface implementation to children molecules", () => {
      const ChildMolecule = molecule((get) => {
        return get(NumberInterface) + 1;
      });

      const TestComponent = () => {
        const value = useMolecule(ChildMolecule);
        return { value };
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <MoleculeProvider
              interface={NumberInterface}
              value={NumberMolecule}
            >
              {children}
            </MoleculeProvider>
          </Outer>
        );
      };

      const { result } = renderHook(TestComponent, {
        wrapper: Wrapper,
      });

      expect(result.current.value).toBe(43);
    });

    test("preserves parent injector cache across multiple providers", () => {
      let sharedMoleculeCreationCount = 0;
      const SharedMolecule = molecule(() => {
        sharedMoleculeCreationCount++;
        return { id: sharedMoleculeCreationCount };
      });

      const InnerMolecule = molecule((get) => {
        const shared = get(SharedMolecule);
        const number = get(NumberInterface);
        return { shared, number };
      });

      // Component outside any provider
      const OuterComponent = () => {
        const shared = useMolecule(SharedMolecule);
        return <div>Outer: {shared.id}</div>;
      };

      // Component inside nested providers
      const InnerComponent = () => {
        const service = useMolecule(InnerMolecule);
        return { sharedId: service.shared.id, number: service.number };
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
          <Outer>
            <OuterComponent />
            <MoleculeProvider
              interface={NumberInterface}
              value={NumberMolecule}
            >
              <MoleculeProvider
                interface={StringInterface}
                value={StringMolecule}
              >
                {children}
              </MoleculeProvider>
            </MoleculeProvider>
          </Outer>
        );
      };

      const { result } = renderHook(InnerComponent, {
        wrapper: Wrapper,
      });

      // SharedMolecule should be created only once despite being used across providers
      expect(sharedMoleculeCreationCount).toBe(1);
      expect(result.current.sharedId).toBe(1);
      expect(result.current.number).toBe(42);
    });
  });
});
