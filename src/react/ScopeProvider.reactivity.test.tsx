import { act, render } from "@testing-library/react";
import React, { useState } from "react";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { ScopeProvider, createScope, molecule, use, useMolecule } from "./";

const TestCope = createScope<{ number?: number }>({});

const lifecycle = createLifecycleUtils();
const TestMol = molecule(() => {
  const scope = use(TestCope);
  // console.log(scope.number); //In the first case, there is no change, and in the second case, the value from one timing ago is output.
  lifecycle.connect(scope.number);
  return { scope };
});

const useTestMol = () => {
  const mol = useMolecule(TestMol);
  const number = mol.scope.number;

  return { number };
};

const Test = () => {
  const { number } = useTestMol();
  return <div>{number}</div>;
};

const TestList = () => {
  const [testList, setTestList] = useState([1, 2, 3, 4, 5]);

  const handleClick = () => {
    setTestList((list) => list.map((l) => l + 1));
  };

  return (
    <>
      <button onClick={handleClick}>Increment</button>
      {testList.map((number, index) => (
        <ScopeProvider key={index} scope={TestCope} value={{ number }}>
          <Test />
        </ScopeProvider>
      ))}
    </>
  );
};

test("Is reactive to changes in ScopeProvider", async () => {
  lifecycle.expectUncalled();

  const screen = render(<TestList />);

  expect(lifecycle.executions.mock.calls).toStrictEqual([
    // Before increment
    [1],
    [2],
    [3],
    [4],
    [5],
  ]);

  const btn = await screen.findByText("Increment");

  act(() => {
    btn.click();
  });

  expect(lifecycle.executions.mock.calls).toStrictEqual([
    // Before increment
    [1],
    [2],
    [3],
    [4],
    [5],
    // After increment
    [2],
    [3],
    [4],
    [5],
    [6],
  ]);

  act(() => {
    btn.click();
  });

  expect(lifecycle.executions.mock.calls).toStrictEqual([
    // Before increment
    [1],
    [2],
    [3],
    [4],
    [5],
    // After increment 1
    [2],
    [3],
    [4],
    [5],
    [6],
    // After increment 2
    [3],
    [4],
    [5],
    [6],
    [7],
  ]);
});
