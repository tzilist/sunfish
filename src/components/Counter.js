import React, { PureComponent } from 'react';
import { func, shape, number } from 'prop-types';
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

    createTransaction()
      .pipe(counterActions.incrementCounter)
      // here is an example with a conditional function that will not run since it returns false
      .pipe(counterActions.incrementCounter, (res) => {
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
