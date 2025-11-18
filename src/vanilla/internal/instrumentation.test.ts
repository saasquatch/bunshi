import { describe, expect, it, vi } from "vitest";
import { LoggingInstrumentation } from "./instrumentation";
import { molecule } from "../molecule";

describe("LoggingInstrumentation", () => {
  it("should log all methods correctly", () => {
    const instrumentation = new LoggingInstrumentation();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const mol = molecule(() => ({ value: 1 }));
    const cacheValue = {
      value: { test: "value" },
      deps: {
        defaultScopes: [],
        downstreamScopes: new Set(),
        downstreamMolecules: new Set(),
      },
      cleanupEffects: [],
      isMounted: true,
      path: [],
      instanceId: 1,
    } as any;

    // Test getInternal
    instrumentation.getInternal(mol);
    expect(consoleSpy).toHaveBeenCalledWith("get", mol);

    // Test subscribe
    instrumentation.subscribe(mol, cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("subscribe", cacheValue.value);

    // Test unsubscribe
    instrumentation.unsubscribe(mol, cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("unsubscribe", cacheValue.value);

    // Test mounted
    instrumentation.mounted("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith("mounted", "arg1", "arg2");

    // Test cleanup
    instrumentation.cleanup(cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("cleanup", cacheValue);

    // Test executed
    instrumentation.executed(mol, cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("executed", mol, cacheValue);

    // Test stage1CacheHit
    instrumentation.stage1CacheHit(mol, cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("stage1CacheHit", mol, cacheValue);

    // Test stage1CacheMiss
    instrumentation.stage1CacheMiss("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith("stage1CacheMiss", "arg1", "arg2");

    // Test stage2CacheHit
    instrumentation.stage2CacheHit(mol, cacheValue);
    expect(consoleSpy).toHaveBeenCalledWith("stage2CacheHit", mol, cacheValue);

    // Test stage2CacheMiss
    instrumentation.stage2CacheMiss("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith("stage2CacheMiss", "arg1", "arg2");

    // Test scopeStopWithCleanup
    instrumentation.scopeStopWithCleanup("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith(
      "scopeStopWithCleanup",
      "arg1",
      "arg2",
    );

    // Test scopeStopWithoutCleanup
    instrumentation.scopeStopWithoutCleanup("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith(
      "scopeStopWithoutCleanup",
      "arg1",
      "arg2",
    );

    // Test scopeRunCleanup
    instrumentation.scopeRunCleanup("arg1", "arg2");
    expect(consoleSpy).toHaveBeenCalledWith("scopeRunCleanup", "arg1", "arg2");

    consoleSpy.mockRestore();
  });
});
