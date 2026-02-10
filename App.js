import React from 'react';
import MapAnimation from './MapAnimation';
import DomainSearch from './DomainSearch';
import './App.css'; // Assuming you'll have some global app styling

function App() {
  return (
    <div className="App">
      <MapAnimation />
      <DomainSearch />
    </div>
  );
}

export default App;