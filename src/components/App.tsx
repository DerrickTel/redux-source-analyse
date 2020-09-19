import React from 'react';
import logo from '../logo.svg';
import './App.css';
import AddTodo from './AddToDo'
import TodoList from './TodoList'

function App(props: any) {

  console.log(props)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <AddTodo />
        <TodoList />
      </header>
    </div>
  );
}

export default App;
