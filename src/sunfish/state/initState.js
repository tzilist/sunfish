class State {
  constructor(state = {}) {
    this.state = state;
    this.listeners = [];
    this.transactions = {};
  }

  update = (transactionId) => {
    this.state = Object.assign({}, this.transactions[transactionId])
    delete this.transactions[transactionId];

    this.runListeners();
  }

  runListeners = () => {
    this.listeners.forEach(listener => listener(this.state));
  }

  pipe = (transactionId, action) => {
    const newState = action(this.transactions[transactionId]);

    this.transactions[transactionId] = newState;

    return {
      pipe: this.pipe.bind(this, transactionId),
      update: this.update.bind(this, transactionId),
    };
  }

  createTransaction = () => {
    const transactionId = Math.random()
      .toString(36)
      .substring(7)
      .split('')
      .join('.');

    this.transactions[transactionId] = Object.assign({}, this.state);

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
