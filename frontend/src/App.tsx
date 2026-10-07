import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Alexa } from './pages/Alexa';
import { Judge } from './pages/Judge';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alexa" element={<Alexa />} />
        <Route path="/judge" element={<Judge />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
