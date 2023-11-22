import { vi } from "vitest";
import { onMount } from "../../vanilla";

export function createLifecycleUtils() {
  const mounts = vi.fn();
  const unmounts = vi.fn();
  const executions = vi.fn();

  const reset = () => {
    mounts.mockReset();
    unmounts.mockReset();
    executions.mockReset();
  };

  const connect = (...args: unknown[]) => {
    executions(...args);
    onMount(() => {
      mounts(...args);
      return () => unmounts(...args);
    });
  };
  beforeEach(() => reset());
  afterEach(() => reset());

  const expectUncalled = () => {
    expect(executions).not.toHaveBeenCalled();
    expect(mounts).not.toHaveBeenCalled();
    expect(unmounts).not.toHaveBeenCalled();
  };

  const expectToMatchCalls = (...args: unknown[]) => {
    expect(executions.mock.calls).toStrictEqual(args);
    expect(mounts.mock.calls).toStrictEqual(args);
    expect(unmounts.mock.calls).toStrictEqual(args);
  };

  const expectToHaveBeenCalledTimes = (num: number) => {
    expect(executions).toHaveBeenCalledTimes(num);
    expect(mounts).toHaveBeenCalledTimes(num);
    expect(unmounts).toHaveBeenCalledTimes(num);
  };

  const expectActivelyMounted = () => {
    expect(executions).toHaveBeenCalledTimes(1);
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).toHaveBeenCalledTimes(0);
  };

  return {
    expectActivelyMounted,
    expectUncalled,
    expectToMatchCalls,
    expectToHaveBeenCalledTimes,
    mounts,
    unmounts,
    executions,
    reset,
    connect,
  };
}
