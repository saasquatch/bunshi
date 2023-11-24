import { molecule, onMount } from "bunshi";
import { assign, createMachine, interpret } from "xstate";

interface CounterContext {
  count: number;
}

type CounterEvent = {
  type: "INCREMENT";
};

export const CountMolecule = molecule(() => {
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
