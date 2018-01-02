# Sunfish

### API

Sunfish has a fairly intuitive, functionaly driven api. The basic usage is as such

```js
 // While in your react component after connecting (see below for example)
 const { createTransaction } = this.props;

 createTransaction()
  .pipe(this.props.someAction)
  .pipe(this.someComponentFunction)
  .pipe(this.props.someOtherAction)
  .update();
```

Sunfish creates a transaction and does not update the state until the transaction is told to do so. You can also update in the midst of a group of actions as such

```js
 const { createTransaction } = this.props;

 createTransaction()
  .pipe(this.props.someAction)
  .updateAndPipe()
  .pipe(this.someComponentFunction)
  .pipe(this.props.someOtherAction)
  .update();
```

It is important to call the update function at the end of your group of function calls as this is what will ultimately set the new state and remove the transaction from Sunfish's state management.

### Functions

#### createTransaction

This function instantiates a new transaction in the state manager. It takes no params and is the first thing that must be called when starting a new chain of functions.

#### pipe
```
pipe(function action(state, context), function conditional (state, context))
```


The pipe function takes in an action callback and a conditional callback. If passed a conditional callback, the pipe function will check whether the callback returns true or false. If it returns false, the action will not be run. 

The actions supplied to pipe can return several things. The most notible is that they may return any of the following keys in their return object

```
{
  state,
  break,
  context,
}
```

If none of these are supplied, it is assumed that the returned object is the new state.

When `break` is supplied, this tells Sunfish to skip any subsequent steps

When `context` is supplied, data is stored within the transaction. This allows the developer to easily pass data from one call to the next without needing to set it in state explicitly.


#### updateAndPipe

Tells Sunfish to merge the current transaction into the current state but allows the developer to continue passing information (such as context) along.

#### update

The final function call, updates the current transaction into state and delete the transaction from memory. Must be called during the final step

Here is a quick example:

```js
class User extends React.PureComponent {
  fetchUserData = async () => {
    const data = await fetch('/api/userData');
    // only context is passed here
    // Sunfish will not update the current state, but will only update the context
    // in the current transaction
    return { context: { data }};
  }

  setUserDataFetchPending = (state) => {
    // The return here does not have state, context, or break key
    // Sunfish assumes the return is the new state
    return {
      ...state,
      userFetchPending: true,
    }
  }

  checkForFetchError = (state, context) => context.status !== 200;

  setUserDataFetchError = (state) => {
    // This function will tell Sunfish to skip any subsequent steps
    // It is important to functions that return a `break` statement need
    // a conditional on them to ensure they aren't run if they aren't needed
    return {
      state: {
        ...state,
        userError: true,
        userErrorMessage: 'failed to load data',
        userFetchPending: false,
      },
      break: true,
    }
  }

  setUserDataFetchSuccess = (state, { data }) => {
    const results = data.json();
    return {
      ...state,
      user: results.user
      userFetchPending: false,
    }
  }


  componentDidMount() {
   const { createTransaction } = this.props;
  
   createTransaction()
    .pipe(this.setUserDataFetchPending)
    .updateAndPipe()
    .pipe(this.fetchUserData)
    .pipe(this.setUserDataFetchError, this.checkForFetchError)
    .pipe(this.setUserDataFetchSuccess)
    .update()
  }

  render() {
    // jsx goes here
  }
}
```

### Examples

First, we need to initialize our state.
```js
import { initState } from '../sunfish';

const INITIAL_STATE = {
  counter: 0,
};


export default initState(INITIAL_STATE);

```


Now we need to create our actions
```js
// actions/counter.js
export const incrementCounter = ({ counter }) => ({ counter: counter + 1 });

export const decrementCounter = ({ counter }) => ({ counter: counter - 1 });

// here we can return an object containering the state and break keys
// By doing so, all subsequent actions will be ignored
export const incrementCounterWithBreak = ({ counter }) => (
  {
    state: { counter: counter + 1 },
    break: true,
  }
);

// here we can also return context, which will be passed to subsequent pipe functions
export const fetchData = async (state) => {
  const data = await fetch('http://mysite.com/api')
    .then(res => res.json);
  
  return { state, context: data };
}

```



```js
// components/Counter.js

import connect from '../sunfish/react/connect';
import * as CounterActions from '../actions/counter';

const mapStateToProps = (state) => {
  const { counter } = state;

  return { counter };
};

const mapActionsToProps = () => ({ counterActions: CounterActions });

class Counter extends PureComponent {
  static propTypes = {
    createTransaction: func.isRequired,
    counterActions: shape({
      incrementCounter: func.isRequired,
      decrementCounter: func.isRequired,
    }).isRequired,
    counter: number.isRequired,
  }

  onIncreaseHandler = () => {
    const { createTransaction, counterActions } = this.props;

    // this transaction has extra actions on purpose to illustrate when actions
    // will and will not be run
    createTransaction()
      .pipe(counterActions.incrementCounter)
      // here is an example with a conditional function that will not run since it returns false
      .pipe(counterActions.incrementCounter, (state) => {
        console.log('here!')
        return false;
      })
      .pipe(counterActions.decrementCounter)
      .pipe(counterActions.incrementCounterWithBreak)
      // this function will never be run since we return a break statement above
      .pipe(counterActions.decrementCounter)
      .update();
  }

  onDecreaseHandler = () => {
    const { createTransaction, counterActions } = this.props;

    createTransaction()
      .pipe(counterActions.decrementCounter)
      .update();
  }

  render() {
    return (
      <React.Fragment>
        <button
          onClick={this.onIncreaseHandler}
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          +
        </button>
        {this.props.counter}
        <button
          onClick={this.onDecreaseHandler}
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          -
        </button>
      </React.Fragment>
    );
  }
}

export default connect(mapStateToProps, mapActionsToProps)(Counter);

```