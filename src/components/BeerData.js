import React, { PureComponent } from 'react';
import { func } from 'prop-types';
import connect from '../sunfish/react/connect';
import * as BeerActions from '../actions/beer';

const mapStateToProps = (state) => {
  const {
    isFetchingData,
    fetchDataError,
    fetchDataSuccess,
    data,
  } = state;

  return {
    isFetchingData,
    fetchDataError,
    fetchDataSuccess,
    data,
  };
};

const mapActionsToProps = () => ({ counterActions: BeerActions });

class Counter extends PureComponent {
  static propTypes = {
    createTransaction: func.isRequired,
  }

  componentDidUpdate() {
    console.log(this.props)
  }

  async componentDidMount() {
    const { createTransaction } = this.props;

   
    createTransaction()
      .pipe(this.setIsFetchingData)
      .updateAndPipe()
      .pipe(this.fetchBeerData)
      .pipe(this.setDataFetchError, this.checkForFetchError)
      .pipe(this.setDataFetchSuccess)
      .update();
  }

  // The return here does not have state, context, or break key
  // Sunfish assumes the return is the new state
  setIsFetchingData = state => (
    {
      ...state,
      isFetchingData: true,
    }
  )

  // This function will tell Sunfish to skip any subsequent steps
  // It is important to functions that return a `break` statement need
  // a conditional on them to ensure they aren't run if they aren't needed
  setDataFetchError = state => (
    {
      state: {
        ...state,
        fetchDataError: true,
        isFetchingData: false,
      },
      break: true,
    }
  );


  setDataFetchSuccess = async (state, { data }) => {
    const results = await data.json();
    return {
      ...state,
      data: results,
      fetchDataSuccess: true,
      isFetchingData: false,
    };
  }

  fetchBeerData = async () => {
    const data = await fetch('https://api.punkapi.com/v2/beers');
    // only context is passed here
    // Sunfish will not update the current state, but will only update the context
    // in the current transaction
    return { context: { data } };
  }

  checkForFetchError = (state, context) => context.data.status !== 200;


  render() {
    return (
      <React.Fragment>
        Pending...
      </React.Fragment>
    );
  }
}

export default connect(mapStateToProps, mapActionsToProps)(Counter);
