export default class State {
  constructor(state = {}) {
    this.state = state;
    this.listeners = [];
    this.transactions = {};
    this.transactionQueue = {};
  }

  update = (transactionId) => {
    this.transactionQueue[transactionId].queue.push({
      action: this._update.bind(this, transactionId),
      conditional: null,
      info: {
        shouldContinueQueue: false,
        isUpdate: true,
      },
    });
  }

  _update = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    delete this.transactions[transactionId];
    delete this.transactionQueue[transactionId];

    this.runListeners();
  }

  pipeAndUpdate = (transactionId, action, conditional) => {
    const updateAction = {
      action: this._pipeAndUpdate.bind(this, transactionId),
      conditional: null,
      info: {
        isUpdate: true,
      },
    };

    const { queue, running } = this.transactionQueue[transactionId];

    queue.push({ action, conditional }, updateAction);

    if (!running) {
      this.transactionQueue[transactionId].running = true;
      this.queueRunner(transactionId);
    }

    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      pipeAndUpdate: this.pipeAndUpdate.bind(this, transactionId),
    };
  }

  _pipeAndUpdate = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    this.runListeners();
  }

  runListeners = () => {
    this.listeners.forEach(listener => listener(this.state));
  }

  queueRunner = (transactionId) => {
    const { queue, queueIndex } = this.transactionQueue[transactionId];
    if (!queue[queueIndex]) {
      this.transactionQueue[transactionId].running = false;
      return null;
    }

    const { action, conditional, info } = queue[queueIndex];

    const transaction = this.transactions[transactionId];

    if (Object.isFrozen(transaction) && (!info || (info && info.isUpdate !== true))) {
      this.transactionQueue[transactionId].queueIndex += 1;
      return this.queueRunner(transactionId);
    }

    const { state, context } = transaction;

    if (conditional) {
      if (conditional && conditional.constructor === Function) {
        const conditionalResults = conditional(state, context);
        if (conditionalResults === false) {
          this.transactionQueue[transactionId].queueIndex += 1;
          return this.queueRunner(transactionId);
        }
      }
    }

    return Promise.resolve(action(state, context))
      .then((actionResults) => {
        const newContext = (actionResults && actionResults.context) || context;
        const shouldBreak = actionResults && actionResults.break && actionResults.break === true;
        const newState = (actionResults && actionResults.state) || state;
    
        this.transactions[transactionId] = { state: newState, context: newContext };
    
        if (shouldBreak === true) {
          Object.freeze(this.transactions[transactionId]);
        }

        if (info && info.shouldContinueQueue === false) {
          return null;
        }

        this.transactionQueue[transactionId].queueIndex += 1;
        return this.queueRunner(transactionId);
      });
  }

  pipe = (transactionId, action, conditional) => {
    const { queue, running } = this.transactionQueue[transactionId];

    queue.push({ action, conditional });

    if (!running) {
      this.transactionQueue[transactionId].running = true;
      this.queueRunner(transactionId);
    }

    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      pipeAndUpdate: this.pipeAndUpdate.bind(this, transactionId),
    };

    
    
    // if (!skipAddition && transactionQueue && transactionQueue.length > 1) {
    //   this.transactionQueue[transactionId].push({ action, conditional });
    //   return returnMethods;
    // }

    
    // const transaction = this.transactions[transactionId];
    // if (Object.isFrozen(transaction)) {
    //   this.transactionQueue[transactionId].shift();
    //   if (Array.isArray(this.transactionQueue[transactionId]) && this.transactionQueue[transactionId].length > 0) {
    //     const { action: nextAction, conditional: nextConditional } = this.transactionQueue[transactionId][0];
    //     this.pipe(transactionId, nextAction, nextConditional, true);
    //   }
    //   return returnMethods;
    // }
    
    // const { state, context } = transaction;
    // if (conditional && conditional.constructor === Function) {
    //   const conditionalResults = conditional(state, context);
    //   if (conditionalResults === false) {
    //     this.transactionQueue[transactionId].shift();
    //     if (Array.isArray(this.transactionQueue[transactionId]) && this.transactionQueue[transactionId].length > 0) {
    //       const { action: nextAction, conditional: nextConditional } = this.transactionQueue[transactionId][0];
    //       this.pipe(transactionId, nextAction, nextConditional, true);
    //     }
    //     return returnMethods;
    //   }
    // }

    // Promise.resolve(action(state, context))
    //   .then((actionResults) => {
    //     const newContext = (actionResults && actionResults.context) || null;
    //     const shouldBreak = actionResults && actionResults.break && actionResults.break === true;
    //     let newState = state;
    
    //     if (actionResults && actionResults.state) {
    //       newState = actionResults.state;
    //     } else if (actionResults && !actionResults.context && !actionResults.break) {
    //       newState = actionResults;
    //     }

    //     this.transactions[transactionId] = { state: newState, context: newContext };
    
    //     if (shouldBreak === true) {
    //       Object.freeze(this.transactions[transactionId]);
    //     }
    //     if (Array.isArray(this.transactionQueue[transactionId])) {
    //       this.transactionQueue[transactionId].shift();
    //       if (this.transactionQueue[transactionId].length > 0) {
    //         const { action: nextAction, conditional: nextConditional } = this.transactionQueue[transactionId][0];
    //         this.pipe(transactionId, nextAction, nextConditional, true);
    //       }
    //     }
    //   });
  }

  createTransaction = () => {
    const transactionId = Math.random()
      .toString(36)
      .substring(7)
      .split('')
      .join('.');

    this.transactions[transactionId] = Object.assign({}, { state: this.state, context: null });
    this.transactionQueue[transactionId] = { queue: [], running: false, queueIndex: 0 };
    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
      pipeAndUpdate: this.pipeAndUpdate.bind(this, transactionId),
    };
  }

  subscribe = (listener) => {
    this.listeners.push(listener);
  }

  unsubscribe = (listener) => {
    this.listners = this.listeners.filter(el => el !== listener);
  }
}