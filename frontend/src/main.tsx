import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import ReaderPage from "./pages/ReaderPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReaderPage />} />
        <Route path="/articles/:slug" element={<ReaderPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
