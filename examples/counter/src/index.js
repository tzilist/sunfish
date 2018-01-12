import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'sunfish';

import Counter from './components/Counter';
import state from './state';

const rootEl = document.getElementById('root');

const render = () => ReactDOM.render(
  <Provider state={state}>
    <Counter />
  </Provider>,
  rootEl,
);

render();