
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Assistant from "./Assistant";
import History from "./pages/History";
import Trash from "./pages/Trash";

function AssistantPage({ mode }) {
  return <Assistant key={mode} initialMode={mode} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<AssistantPage mode="chat" />} />
      <Route path="/image" element={<AssistantPage mode="image" />} />
      <Route path="/objects" element={<AssistantPage mode="objects" />} />
      <Route path="/history" element={<History />} />
      <Route path="/trash" element={<Trash />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
