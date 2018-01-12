import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'sunfish';

import AsyncComponent from './components/AsyncComponent';

import state from './state';

const rootEl = document.getElementById('root');

const render = () => ReactDOM.render(
  <Provider state={state}>
    <AsyncComponent />
  </Provider>,
  rootEl,
);

render();
