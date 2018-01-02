import React from 'react';
import ReactDOM from 'react-dom';
import BeerData from './components/BeerData';
import Provider from './sunfish/react/Provider';
import state from './state';

const rootEl = document.getElementById('root');

const render = () => ReactDOM.render(
  <Provider state={state}>
    <BeerData />
  </Provider>,
  rootEl,
);

render();
