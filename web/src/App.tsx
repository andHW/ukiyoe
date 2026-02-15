import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/home/HomePage";
import GamePage from "./components/game/GamePage";
import BoardBuilder from "./components/builder/BoardBuilder";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<GamePage />} />
        <Route path="/builder" element={<BoardBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
