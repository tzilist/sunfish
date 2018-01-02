export default class State {
  constructor(state = {}) {
    this.state = state;
    this.listeners = [];
    this.transactions = {};
    this.transactionFns = {};
  }

  update = (transactionId) => {
    this.transactionFns[transactionId].push({
      action: this._update.bind(this, transactionId),
      conditional: null,
    });
  }

  _update = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    delete this.transactions[transactionId];
    delete this.transactionFns[transactionId];

    this.runListeners();
  }

  updateAndPipe = (transactionId) => {
    this.transactionFns[transactionId].push({
      action: this._updateAndPipe.bind(this, transactionId),
      conditional: null,
    });

    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      updateAndPipe: this.updateAndPipe.bind(this, transactionId),
    };
  }

  _updateAndPipe = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    this.runListeners();
  }

  runListeners = () => {
    this.listeners.forEach(listener => listener(this.state));
  }

  pipe = (transactionId, action, conditional, skipAddition = false) => {
    const returnMethods = {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      updateAndPipe: this.updateAndPipe.bind(this, transactionId),
    };

    const transactionFns = this.transactionFns[transactionId];
    
    this.transactionFns[transactionId].push({ action, conditional });
    if (!skipAddition && transactionFns && transactionFns.length > 1) {
      return returnMethods;
    }

    const transaction = this.transactions[transactionId];

    if (Object.isFrozen(transaction)) {
      return returnMethods;
    }
    const { state, context } = transaction;
    if (conditional && conditional.constructor === Function) {
      const conditionalResults = conditional(state, context);
      if (conditionalResults === false) {
        this.transactionFns[transactionId].shift();
        if (Array.isArray(this.transactionFns[transactionId]) && this.transactionFns[transactionId].length > 0) {
          const { action: nextAction, conditional: nextConditional } = this.transactionFns[transactionId][0];
          this.pipe(transactionId, nextAction, nextConditional, true);
        }
        return returnMethods;
      }
    }

    Promise.resolve(action(state, context))
      .then((actionResults) => {
        const newContext = (actionResults && actionResults.context) || null;
        const shouldBreak = actionResults && actionResults.break && actionResults.break === true;
        let newState = state;
    
        if (actionResults && actionResults.state) {
          newState = actionResults.state;
        } else if (actionResults && !actionResults.context && !actionResults.break) {
          newState = actionResults;
        }

        this.transactions[transactionId] = { state: newState, context: newContext };
    
        if (shouldBreak === true) {
          Object.freeze(this.transactions[transactionId]);
        }
        if (Array.isArray(this.transactionFns[transactionId])) {
          this.transactionFns[transactionId].shift();
          if (this.transactionFns[transactionId].length > 0) {
            const { action: nextAction, conditional: nextConditional } = this.transactionFns[transactionId][0];
            this.pipe(transactionId, nextAction, nextConditional, true);
          }
        }
      });

    return returnMethods;
  }

  createTransaction = () => {
    const transactionId = Math.random()
      .toString(36)
      .substring(7)
      .split('')
      .join('.');

    this.transactions[transactionId] = Object.assign({}, { state: this.state, context: null });
    this.transactionFns[transactionId] = [];
    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      updateAndPipe: this.updateAndPipe.bind(this, transactionId),
    };
  }

  subscribe = (listener) => {
    this.listeners.push(listener);
  }

  unsubscribe = (listener) => {
    this.listners = this.listeners.filter(el => el !== listener);
  }
}