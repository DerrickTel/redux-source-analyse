import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <input onChange={handleInputChange} />
        <button>添加</button>
      </header>
      {}
    </div>
  );
}

export default App;
