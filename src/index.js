import React from 'react';
import ReactDOM from 'react-dom';
import Counter from './components/Counter';
import Provider from './sunfish/react/Provider';
import state from './state';

const rootEl = document.getElementById('root');

const render = () => ReactDOM.render(
  <Provider state={state}>
    <Counter />
  </Provider>,
  rootEl,
);

render();
