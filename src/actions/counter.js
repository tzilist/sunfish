export const incrementCounter = ({ counter }) => ({ counter: counter + 1 });

export const decrementCounter = ({ counter }) => ({ counter: counter - 1 });

export const incrementCounterWithBreak = ({ counter }) => (
  {
    state: { counter: counter + 1 },
    break: true,
  }
);
