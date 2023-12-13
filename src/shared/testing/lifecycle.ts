import { vi } from "vitest";
import { onMount } from "../../vanilla";

export function createLifecycleUtils() {
  const mounts = vi.fn();
  const unmounts = vi.fn();
  const executions = vi.fn();

  function reset() {
    mounts.mockReset();
    unmounts.mockReset();
    executions.mockReset();
  }

  const connect = (...args: unknown[]) => {
    executions(...args);
    // Note: Uses `function` instead of arrow function
    // because it's easier to use in debugging
    onMount(function testMountFn() {
      mounts(...args);
      return function testUnMountFn() {
        unmounts(...args);
      };
    });
  };
  beforeEach(() => reset());
  afterEach(() => reset());

  const expectUncalled = () => {
    expect.soft(executions).not.toHaveBeenCalled();
    expect.soft(mounts).not.toHaveBeenCalled();
    expect(unmounts).not.toHaveBeenCalled();
  };

  const expectToMatchCalls = (...args: unknown[]) => {
    expect.soft(executions.mock.calls).toStrictEqual(args);
    expect.soft(mounts.mock.calls).toStrictEqual(args);
    expect(unmounts.mock.calls).toStrictEqual(args);
  };

  const expectToHaveBeenCalledTimes = (num: number) => {
    expect.soft(executions).toHaveBeenCalledTimes(num);
    expect.soft(mounts).toHaveBeenCalledTimes(num);
    expect(unmounts).toHaveBeenCalledTimes(num);
  };

  const expectActivelyMounted = () => {
    expect.soft(executions).toHaveBeenCalledTimes(1);
    expect.soft(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).toHaveBeenCalledTimes(0);
  };

  const expectRunButUnmounted = () => {
    expect.soft(executions).toHaveBeenCalledTimes(1);
    expect.soft(mounts).not.toHaveBeenCalled();
    expect(unmounts).not.toHaveBeenCalled();
  };

  return {
    expectActivelyMounted,
    expectUncalled,
    expectToMatchCalls,
    expectToHaveBeenCalledTimes,
    expectRunButUnmounted,
    mounts,
    unmounts,
    executions,
    reset,
    connect,
  };
}