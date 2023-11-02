import { ComponentScope, molecule } from "bunshi";
import { assign, createMachine, interpret } from "xstate";

interface CounterContext {
  count: number;
}

type CounterEvent = {
  type: "INCREMENT";
};

export const CountMolecule = molecule((_, scope) => {
  scope(ComponentScope);

  const countMachine = createMachine<CounterContext, CounterEvent>({
    id: "counter",
    context: { count: 0 },
    on: {
      INCREMENT: {
        actions: assign({ count: (ctx) => ctx.count + 1 }),
      },
    },
  });

  return interpret(countMachine).start();
});
