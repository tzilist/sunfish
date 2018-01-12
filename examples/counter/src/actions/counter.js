export const incrementCounter = ({ counter }) => ({ state: { counter: counter + 1 }});

export const decrementCounter = ({ counter }) => ({ state: { counter: counter - 1 }});

export const incrementCounterWithBreak = ({ counter }) => (
  {
    state: { counter: counter + 1 },
    break: true,
  }
);
