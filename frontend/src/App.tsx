import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Alexa } from './pages/Alexa';
import { Judge } from './pages/Judge';
import { Plans } from './pages/Plans';
import { Commitments } from './pages/Commitments';
import { Memory } from './pages/Memory';
import { Activity } from './pages/Activity';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/commitments" element={<Commitments />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/alexa" element={<Alexa />} />
        <Route path="/judge" element={<Judge />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
