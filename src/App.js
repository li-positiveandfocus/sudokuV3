import React, { useState } from "react";
import "./App.css";
import SudokuVisualizer from "./SudokuVisualizer";
import Sudoku4x4 from "./Sudoku4x4";
import Sudoku4x4DFS from "./Sudoku4x4DFS";
import Sudoku4x4BruteForce from "./Sudoku4x4BruteForce";
import MyComparisonPage from "./SudokuComparison"; // <-- the new file

function App() {
  // Add "compare" as a new tab option
  const [activeTab, setActiveTab] = useState("game4x4");

  return (
    <div className="App">
      <div className="bg-indigo-700 text-white p-4 shadow-md">
        <h1 className="text-3xl font-bold text-center">
          For "Play Hard, Study Harder" - You !
        </h1>
        <h1 className="text-3xl font-bold text-center">
          Play Sudoku + Learn DFS & Backtracking Algorithm
        </h1>
      </div>

      <div className="flex justify-center mt-4 mb-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-wrap">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "game4x4"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("game4x4")}
            >
              4x4 Playable Game
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "game4x4-dfs"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("game4x4-dfs")}
            >
              4x4 Sudoku DFS
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "dfs"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("dfs")}
            >
              9x9 DFS Visualization
            </button>
            {/* New Compare tab */}
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "compare"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("compare")}
            >
              Compare BF & DFS
            </button>
          </div>
        </div>
      </div>

      {/* Render the chosen component */}
      {activeTab === "game4x4" && <Sudoku4x4 />}
      {activeTab === "game4x4-dfs" && <Sudoku4x4DFS />}
      {activeTab === "dfs" && <SudokuVisualizer />}
      {activeTab === "game4x4-brute" && <Sudoku4x4BruteForce />}
      {activeTab === "compare" && <MyComparisonPage />}
    </div>
  );
}

export default App;
