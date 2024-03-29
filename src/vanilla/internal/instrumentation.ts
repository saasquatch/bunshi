import type { AnyMolecule, MoleculeCacheValue } from "./internal-types";

export interface Instrumentation {
  getInternal(m: AnyMolecule): void;
  subscribe(m: AnyMolecule, next: MoleculeCacheValue): void;
  unsubscribe(m: AnyMolecule, next: MoleculeCacheValue): void;
  mounted(...args: unknown[]): void;
  cleanup(next: MoleculeCacheValue): void;
  executed(m: AnyMolecule, next: Partial<MoleculeCacheValue>): void;
  stage1CacheHit(m: AnyMolecule, next: MoleculeCacheValue): void;
  stage1CacheMiss(...args: unknown[]): void;
  stage2CacheHit(m: AnyMolecule, next: MoleculeCacheValue): void;
  stage2CacheMiss(...args: unknown[]): void;

  scopeStopWithCleanup(...args: unknown[]): void;
  scopeStopWithoutCleanup(...args: unknown[]): void;

  scopeRunCleanup(...args: unknown[]): void;
}

export class LoggingInstrumentation implements Instrumentation {
  scopeRunCleanup(...args: unknown[]): void {
    console.log("scopeRunCleanup", ...args);
  }
  scopeStopWithCleanup(...args: unknown[]): void {
    console.log("scopeStopWithCleanup", ...args);
  }
  scopeStopWithoutCleanup(...args: unknown[]): void {
    console.log("scopeStopWithoutCleanup", ...args);
  }
  subscribe(m: AnyMolecule, next: MoleculeCacheValue) {
    console.log("subscribe", next.value);
  }
  unsubscribe(m: AnyMolecule, next: MoleculeCacheValue) {
    console.log("unsubscribe", next.value);
  }
  getInternal(m: AnyMolecule): void {
    console.log("get", m);
  }
  mounted(...args: unknown[]): void {
    console.log("mounted", ...args);
  }
  cleanup(...args: unknown[]): void {
    console.log("cleanup");
  }
  executed(...args: unknown[]): void {
    console.log("executed");
  }
  stage1CacheHit(...args: unknown[]): void {
    console.log("stage1CacheHit");
  }
  stage1CacheMiss(...args: unknown[]): void {
    console.log("stage1CacheMiss");
  }
  stage2CacheHit(...args: unknown[]): void {
    console.log("stage2CacheHit");
  }
  stage2CacheMiss(...args: unknown[]): void {
    console.log("stage2CacheMiss");
  }
}
