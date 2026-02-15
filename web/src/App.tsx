import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/home/HomePage";
import GamePage from "./components/game/GamePage";
import BoardBuilder from "./components/builder/BoardBuilder";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<GamePage />} />
        <Route path="/builder" element={<BoardBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}
