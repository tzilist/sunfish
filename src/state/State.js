export default class State {
  constructor(state = {}) {
    this.state = state;
    this.listeners = [];
    this.transactions = {};
    this.transactionQueue = {};

    this.update = this.update.bind(this);
    this._update = this._update.bind(this);
    this.pipeAndUpdate = this.pipeAndUpdate.bind(this);
    this._pipeAndUpdate = this._pipeAndUpdate.bind(this);
    this.runListeners = this.runListeners.bind(this);
    this.queueRunner = this.queueRunner.bind(this);
    this.pipe = this.pipe.bind(this);
    this.createTransaction = this.createTransaction.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  update(transactionId) {
    this.transactionQueue[transactionId].queue.push({
      action: this._update.bind(this, transactionId),
      conditional: null,
      info: {
        shouldContinueQueue: false,
        isUpdate: true,
      },
    });
  }

  _update(transactionId) {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    delete this.transactions[transactionId];
    delete this.transactionQueue[transactionId];

    this.runListeners();
  }

  pipeAndUpdate(transactionId, action, conditional) {
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

  _pipeAndUpdate(transactionId) {
    this.state = Object.assign({}, this.transactions[transactionId].state);
    this.runListeners();
  }

  runListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  queueRunner(transactionId) {
    const { queue, queueIndex } = this.transactionQueue[transactionId];
    if (!queue[queueIndex]) {
      this.transactionQueue[transactionId].running = false;
      return null;
    }

    const { action, conditional, info } = queue[queueIndex];

    const transaction = this.transactions[transactionId];

    /**
     * Here we check if the object is frozen (i.e. a break statement was declared)
     * Even if it is frozen, we do want to run the function if it is and update so we check to see if
     * Info is not set (in which case it is a user defined function)
     * Info is set, but 'isUpdate' is not true
     */
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

  pipe(transactionId, action, conditional) {
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
  }

  createTransaction() {
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

  subscribe(listener) {
    this.listeners.push(listener);
  }

  unsubscribe(listener) {
    this.listners = this.listeners.filter(el => el !== listener);
  }
}