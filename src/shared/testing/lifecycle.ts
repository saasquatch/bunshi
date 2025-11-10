import { vi } from "vitest";
import { onMount } from "../../vanilla";

export type LifecycleUtilsTuple = [
  executions: number,
  mounts: number,
  unmounts: number,
];

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

  const expectToMatchCalls = (...args: unknown[]) => {
    expect.soft(executions.mock.calls).toStrictEqual(args);
    expect.soft(mounts.mock.calls).toStrictEqual(args);
    expect(unmounts.mock.calls).toStrictEqual(args);
  };

  const expectCalledTimesEach = (
    timesExecuted: number,
    timesMounted: number,
    timesUnmounted: number,
  ) => {
    expect(
      [
        executions.mock.calls.length,
        mounts.mock.calls.length,
        unmounts.mock.calls.length,
      ],
      "component lifecycle calls mismatch",
    ).toStrictEqual([timesExecuted, timesMounted, timesUnmounted]);
  };

  const expectToHaveBeenCalledTimes = (num: number) => {
    expectCalledTimesEach(num, num, num);
  };

  const expectUncalled = () => expectCalledTimesEach(0, 0, 0);
  const expectRunButUnmounted = () => expectCalledTimesEach(1, 0, 0);
  const expectActivelyMounted = () => expectCalledTimesEach(1, 1, 0);

  return {
    expectActivelyMounted,
    expectUncalled,
    expectToMatchCalls,
    expectToHaveBeenCalledTimes,
    expectRunButUnmounted,
    expectCalledTimesEach,
    mounts,
    unmounts,
    executions,
    reset,
    connect,
  };
}
