import { ComponentScope, molecule, onMount, use } from "bunshi";
import { assign, createMachine, interpret } from "xstate";

interface CounterContext {
  count: number;
}

type CounterEvent = {
  type: "INCREMENT";
};

export const CountMolecule = molecule(() => {
  use(ComponentScope);

  const countMachine = createMachine<CounterContext, CounterEvent>({
    id: "counter",
    context: { count: 0 },
    on: {
      INCREMENT: {
        actions: assign({ count: (ctx) => ctx.count + 1 }),
      },
    },
  });

  const actor = interpret(countMachine);

  onMount(() => {
    actor.start();
    return () => actor.stop();
  });
  return actor;
});
