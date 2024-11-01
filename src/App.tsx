import React from "react";
import MainMenu from "./components/MainMenu";
import Matchmaking from "./components/Matchmaking";
import InGame from "./components/InGame";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        <Route path="/in-game" element={<InGame />} />
      </Routes>
    </Router>
  );
};

export default App;