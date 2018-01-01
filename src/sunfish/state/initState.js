class State {
  constructor(state = {}) {
    this.state = state;
    this.listeners = [];
    this.transactions = {};
  }

  update = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    delete this.transactions[transactionId];

    this.runListeners();
  }

  runListeners = () => {
    this.listeners.forEach(listener => listener(this.state));
  }

  pipe = (transactionId, action, conditional) => {
    const returnMethods = {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
    };

    const transaction = this.transactions[transactionId];

    if (Object.isFrozen(transaction)) {
      return returnMethods;
    }
    const { state, context } = transaction;


    if (conditional && conditional.constructor === Function) {
      const conditionalResults = conditional(state, context);
      if (conditionalResults === false) {
        return returnMethods;
      }
    }

    const actionResults = action(state, context);

    // const { newState, newContext } = (actionResults && actionResults.state && actionResults.context)
    //   ? { newState: actionResults.state, newContext: actionResults.context }
    //   : { newState: actionResults, newContext: null };

    const newState = (actionResults && actionResults.state) || actionResults;
    const newContext = (actionResults && actionResults.state && actionResults.context) || null;
    const shouldBreak = actionResults && actionResults.state && actionResults.break && actionResults.break === true;


    this.transactions[transactionId] = { state: newState, context: newContext };

    if (shouldBreak) {
      Object.freeze(this.transactions[transactionId]);
    }

    console.log(this.transactions[transactionId])
    return returnMethods;
  }

  createTransaction = () => {
    const transactionId = Math.random()
      .toString(36)
      .substring(7)
      .split('')
      .join('.');

    this.transactions[transactionId] = Object.assign({}, { state: this.state, context: null });

    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
    };
  }

  subscribe = (listener) => {
    this.listeners.push(listener);
  }

  unsubscribe = (listener) => {
    this.listners = this.listeners.filter(el => el !== listener);
  }
}

export default function initState(state = {}) {
  return new State(state);
}
