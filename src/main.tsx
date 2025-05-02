import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import AllLetters from "./components/AllLetters";
import WordHunt from "./components/WordHunt";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<AllLetters />} />
        <Route path="/word-hunt" element={<WordHunt />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
