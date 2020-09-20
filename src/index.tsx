import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import { Provider } from './react-redux'
import { createStore, applyMiddleware } from './redux'
import rootReducer from './reducers'

// middleware
const logger = (store:any) => (next:any) => (action:any) => {
  // debugger
  console.info('dispatching', action)
  const result = next(action);
  console.log('next state', store.getState())
  return result
}

const store = createStore(rootReducer, {todos:[]}, applyMiddleware(logger));

const unSubscribe = store.subscribe(() => {
  console.log('store.subscribe', store.getState())
})
store.subscribe(() => {
  console.log('store.subscribe2', store.getState())
})
// unSubscribe();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
