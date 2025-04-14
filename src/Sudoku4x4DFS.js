import React, { useState, useEffect, useRef } from "react";
import SudokuTreeVisualization from "./SudokuTreeVisualization";

const Sudoku4x4DFS = () => {
  // Initial 4x4 Sudoku board with backtrack scenarios
  const initialBoard = [
    [1, 0, 0, 0],
    [2, 0, 1, 0],
    [0, 2, 0, 0],
    [4, 0, 3, 1],
  ];

  const [board, setBoard] = useState(initialBoard);
  const [originalBoard, setOriginalBoard] = useState(initialBoard);
  const [dfsPath, setDfsPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);

  // We’ll treat isSolving like “isPlaying”
  const [isSolving, setIsSolving] = useState(false);

  // Speed for auto-advancing
  const [solveSpeed, setSolveSpeed] = useState(2000);

  // Explanation text for current step
  const [dfsExplanation, setDfsExplanation] = useState(
    "Click 'Run DFS Algorithm' to see how DFS solves Sudoku"
  );

  // Keep track of how many forward/backtrack steps have happened
  const [forwardStepCount, setForwardStepCount] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);

  // Path lines (for drawing lines from one cell to the next)
  const [pathLines, setPathLines] = useState([]);
  const [visiblePathLines, setVisiblePathLines] = useState([]);

  // Board + cell refs (for drawing lines in an SVG overlay)
  const boardRef = useRef(null);
  const cellRefs = useRef({});

  // --------------------------------------------------------------------------------
  // Lifecycle: Initialize the board when component mounts
  // --------------------------------------------------------------------------------
  useEffect(() => {
    startNewGame();
  }, []);

  // --------------------------------------------------------------------------------
  // Helper: registerCellRef
  // --------------------------------------------------------------------------------
  const registerCellRef = (row, col, ref) => {
    if (!cellRefs.current) cellRefs.current = {};
    cellRefs.current[`${row},${col}`] = ref;
  };

  // --------------------------------------------------------------------------------
  // Reset all states for a new game
  // --------------------------------------------------------------------------------
  const startNewGame = () => {
    const copy = initialBoard.map((row) => [...row]);
    setBoard(copy);
    setOriginalBoard(copy);
    setDfsPath([]);
    setCurrentPathIndex(0);
    setIsSolving(false);
    setDfsExplanation("Click 'Run DFS Algorithm' to see how DFS solves Sudoku");
    setPathLines([]);
    setVisiblePathLines([]);
    setForwardStepCount(0);
    setBacktrackCount(0);
  };

  // --------------------------------------------------------------------------------
  // Find cell center (for line drawing)
  // --------------------------------------------------------------------------------
  const getCellCenter = (row, col) => {
    const cellRef = cellRefs.current[`${row},${col}`];
    if (!cellRef || !boardRef.current) return { x: 0, y: 0 };

    const cellRect = cellRef.getBoundingClientRect();
    const boardRect = boardRef.current.getBoundingClientRect();

    return {
      x: cellRect.left + cellRect.width / 2 - boardRect.left,
      y: cellRect.top + cellRect.height / 2 - boardRect.top,
    };
  };

  // --------------------------------------------------------------------------------
  // Check if placing num at board[row][col] is valid
  // --------------------------------------------------------------------------------
  const isValidPlacement = (board, row, col, num) => {
    // Check row
    for (let i = 0; i < 4; i++) {
      if (board[row][i] === num) return false;
    }

    // Check column
    for (let i = 0; i < 4; i++) {
      if (board[i][col] === num) return false;
    }

    // Check 2x2 box
    const boxRow = Math.floor(row / 2) * 2;
    const boxCol = Math.floor(col / 2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  };

  // --------------------------------------------------------------------------------
  // DFS-solve the puzzle, building a dfsPath
  // --------------------------------------------------------------------------------
  const solveDFS = () => {
    const boardCopy = board.map((row) => [...row]);
    const path = [];
    const lines = [];
    let previousCell = null;

    // Reset path data
    setDfsPath([]);
    setCurrentPathIndex(0);
    setPathLines([]);
    setVisiblePathLines([]);
    setDfsExplanation("Starting DFS algorithm...");
    setForwardStepCount(0);
    setBacktrackCount(0);

    // The actual DFS
    const solve = (board, depth = 0) => {
      // Find an empty cell
      let emptyCell = null;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (board[i][j] === 0) {
            emptyCell = [i, j];
            break;
          }
        }
        if (emptyCell) break;
      }

      // If no empty cell, puzzle is solved
      if (!emptyCell) {
        return true;
      }

      const [row, col] = emptyCell;
      const currentCell = { row, col };

      // Draw a "move" line from previousCell -> currentCell (if not the first move)
      if (previousCell !== null) {
        lines.push({
          from: previousCell,
          to: currentCell,
          type: "move",
          index: path.length,
        });
      }
      previousCell = currentCell;

      // Try each possible number
      for (let num = 1; num <= 4; num++) {
        if (isValidPlacement(board, row, col, num)) {
          // Place number
          board[row][col] = num;

          // Record "forward" step
          path.push({
            type: "forward",
            row,
            col,
            value: num,
            depth,
            explanation: `Placing ${num} at (${row + 1}, ${col + 1})`,
          });

          // Recurse
          if (solve(board, depth + 1)) {
            return true;
          }

          // Backtrack
          board[row][col] = 0;
          lines.push({
            from: previousCell,
            to: currentCell,
            type: "backtrack",
            index: path.length,
          });
          path.push({
            type: "backtrack",
            row,
            col,
            value: num,
            depth,
            explanation: `Backtracking from (${row + 1}, ${
              col + 1
            }) - Removing ${num}`,
          });
        }
      }

      // If we exhaust all numbers, no solution from here
      previousCell = null;
      return false;
    };

    // Slight delay so the board can render
    setTimeout(() => {
      solve(boardCopy);
      setDfsPath(path);
      setPathLines(lines);

      // If we built a path, we can auto-play
      if (path.length > 0) {
        setIsSolving(true); // Start auto-play
      } else {
        setDfsExplanation("No solution possible from this configuration.");
      }
    }, 100);
  };

  // --------------------------------------------------------------------------------
  // applyStepsUpToIndex: re-construct the board to a given path index
  // --------------------------------------------------------------------------------
  const applyStepsUpToIndex = (index) => {
    // Rebuild board from original
    const newBoard = originalBoard.map((row) => [...row]);
    let fCount = 0;
    let bCount = 0;

    // Rebuild lines up to this step
    const visibleLinesNow = pathLines.filter((line) => line.index < index);

    for (let i = 0; i < index; i++) {
      const step = dfsPath[i];
      if (!step) break;
      if (step.type === "forward") {
        newBoard[step.row][step.col] = step.value;
        fCount++;
      } else if (step.type === "backtrack") {
        newBoard[step.row][step.col] = 0;
        bCount++;
      }
    }

    // Explanation is from the current step
    const step = dfsPath[index - 1];
    const explanation = step ? step.explanation : "Starting DFS...";

    // Update states
    setBoard(newBoard);
    setDfsExplanation(explanation);
    setForwardStepCount(fCount);
    setBacktrackCount(bCount);
    setVisiblePathLines(visibleLinesNow);
    setCurrentPathIndex(index);
  };

  // --------------------------------------------------------------------------------
  // Next / Prev Step
  // --------------------------------------------------------------------------------
  const nextStep = () => {
    // Move 1 step forward if possible
    if (currentPathIndex < dfsPath.length) {
      applyStepsUpToIndex(currentPathIndex + 1);
    }
  };

  const prevStep = () => {
    // Move 1 step backward if possible
    if (currentPathIndex > 0) {
      applyStepsUpToIndex(currentPathIndex - 1);
    }
  };

  // --------------------------------------------------------------------------------
  // When isSolving=true, auto-advance the steps
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (isSolving) {
      // If we still have steps, schedule next
      if (currentPathIndex < dfsPath.length) {
        const timer = setTimeout(() => {
          nextStep();
        }, solveSpeed);
        return () => clearTimeout(timer);
      } else {
        setIsSolving(false);
        // If the last step was forward, puzzle is solved
        if (dfsPath.length > 0) {
          const lastStep = dfsPath[dfsPath.length - 1];
          if (lastStep.type === "forward") {
            setDfsExplanation("Solution found! DFS algorithm complete.");
          } else {
            setDfsExplanation("No solution could be found.");
          }
        }
      }
    }
  }, [isSolving, currentPathIndex, dfsPath, solveSpeed]);

  // --------------------------------------------------------------------------------
  // Toggle auto-play
  // --------------------------------------------------------------------------------
  const toggleDFS = () => {
    // Pause or resume
    setIsSolving(!isSolving);
  };

  // --------------------------------------------------------------------------------
  // Reset DFS
  // --------------------------------------------------------------------------------
  const resetDFS = () => {
    // Stop auto-play
    setIsSolving(false);
    // Revert to original board
    setBoard(originalBoard.map((row) => [...row]));
    setDfsExplanation("Algorithm reset. Click 'Run DFS Algorithm' again.");
    setForwardStepCount(0);
    setBacktrackCount(0);
    setVisiblePathLines([]);
    setCurrentPathIndex(0);
  };

  // --------------------------------------------------------------------------------
  // Check if a cell is the "active" cell in the current step
  // (Only needed for coloring the board if you want the same effect as before)
  // --------------------------------------------------------------------------------
  const isActiveCell = (row, col) => {
    if (currentPathIndex === 0 || currentPathIndex > dfsPath.length)
      return false;
    const step = dfsPath[currentPathIndex - 1];
    return step && step.row === row && step.col === col;
  };

  const getCurrentStepType = () => {
    if (currentPathIndex === 0 || currentPathIndex > dfsPath.length)
      return null;
    return dfsPath[currentPathIndex - 1]?.type || null;
  };

  // --------------------------------------------------------------------------------
  // Render lines (SVG)
  // --------------------------------------------------------------------------------
  const renderPathLines = () => {
    if (!boardRef.current || !visiblePathLines.length) return null;
    return visiblePathLines.map((line, index) => {
      const { from, to, type } = line;
      if (!from || !to) return null;

      const start = getCellCenter(from.row, from.col);
      const end = getCellCenter(to.row, to.col);

      if (!start || !end) return null;

      const color = type === "move" ? "#10b981" : "#ef4444"; // green vs red
      const dashArray = type === "backtrack" ? "5,5" : "none";

      return (
        <line
          key={`line-${index}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={dashArray}
          markerEnd={`url(#${
            type === "move" ? "arrowForward" : "arrowBacktrack"
          })`}
        />
      );
    });
  };

  // --------------------------------------------------------------------------------
  // JSX Render
  // --------------------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <div className="max-w-5xl w-full">
        <h1 className="text-2xl font-bold mb-2">
          4x4 Sudoku DFS with Backtracking
        </h1>
        <p className="text-gray-600 mb-4">
          {isSolving
            ? `Visualizing DFS Algorithm: Step ${currentPathIndex} of ${dfsPath.length}`
            : "Click 'Run DFS Algorithm' to see how DFS solves the puzzle with backtracking"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* -------------------- SUDOKU BOARD PANEL -------------------- */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Sudoku Board</h2>

            <div className="flex justify-center mb-4 relative">
              {/* SVG overlay for drawing path lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                ref={boardRef}
              >
                <defs>
                  <marker
                    id="arrowForward"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                  <marker
                    id="arrowBacktrack"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                </defs>
                {renderPathLines()}
              </svg>

              {/* 4x4 Board */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden z-0">
                <div className="grid grid-cols-4 gap-px bg-gray-300">
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isOriginal =
                        originalBoard[rowIndex][colIndex] !== 0;
                      const isActive = isActiveCell(rowIndex, colIndex);
                      const stepType = getCurrentStepType();

                      let bgColor = "bg-white";
                      if (isOriginal) {
                        bgColor = "bg-blue-50";
                      } else if (isActive) {
                        bgColor =
                          stepType === "forward"
                            ? "bg-green-200"
                            : "bg-red-200";
                      }

                      // For bold box lines
                      const borderTop =
                        rowIndex % 2 === 0
                          ? "border-t-2 border-gray-800"
                          : "border-t border-gray-300";
                      const borderBottom =
                        rowIndex === 3
                          ? "border-b-2 border-gray-800"
                          : rowIndex % 2 === 1
                          ? "border-b-2 border-gray-800"
                          : "border-b border-gray-300";
                      const borderLeft =
                        colIndex % 2 === 0
                          ? "border-l-2 border-gray-800"
                          : "border-l border-gray-300";
                      const borderRight =
                        colIndex === 3
                          ? "border-r-2 border-gray-800"
                          : colIndex % 2 === 1
                          ? "border-r-2 border-gray-800"
                          : "border-r border-gray-300";

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          ref={(el) => registerCellRef(rowIndex, colIndex, el)}
                          className={`flex items-center justify-center w-16 h-16 ${bgColor} ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} transition-colors duration-300`}
                        >
                          <span
                            className={`text-2xl ${
                              isOriginal
                                ? "font-bold text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            {cell !== 0 ? cell : ""}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Status panel: explanation, counters, progress bar */}
            <div className="mt-3">
              <p className="mb-3 text-gray-700">{dfsExplanation}</p>

              {/* Stats counters */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                  <p className="text-sm text-blue-800 font-medium">
                    Forward Steps
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {forwardStepCount}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                  <p className="text-sm text-red-800 font-medium">
                    Backtrack Steps
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {backtrackCount}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {dfsPath.length > 0 && (
                <div className="mb-4">
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(currentPathIndex / dfsPath.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      Progress:{" "}
                      {Math.round((currentPathIndex / dfsPath.length) * 100)}%
                    </span>
                    <span>
                      Step {currentPathIndex} of {dfsPath.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* -------------------- CONTROLS -------------------- */}
            <div className="flex flex-wrap gap-2">
              {/* Run DFS */}
              <button
                onClick={solveDFS}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow"
                disabled={isSolving || dfsPath.length > 0}
              >
                Run DFS Algorithm
              </button>

              {/* Play/Pause (auto-play) */}
              <button
                onClick={toggleDFS}
                className="py-2 px-4 rounded-lg shadow bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={dfsPath.length === 0}
              >
                {isSolving ? "Pause" : "Play"}
              </button>

              {/* Previous */}
              <button
                onClick={prevStep}
                className={`py-2 px-4 rounded-lg shadow ${
                  currentPathIndex <= 0
                    ? "bg-gray-300 text-gray-500"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                disabled={currentPathIndex <= 0}
              >
                Previous
              </button>

              {/* Next */}
              <button
                onClick={nextStep}
                className={`py-2 px-4 rounded-lg shadow ${
                  currentPathIndex >= dfsPath.length
                    ? "bg-gray-300 text-gray-500"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                disabled={currentPathIndex >= dfsPath.length}
              >
                Next
              </button>

              {/* Reset */}
              <button
                onClick={resetDFS}
                className={`py-2 px-4 rounded-lg shadow ${
                  dfsPath.length > 0
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-300 text-gray-500"
                }`}
                disabled={dfsPath.length === 0}
              >
                Reset
              </button>

              {/* Speed slider */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-700">Speed:</span>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={solveSpeed}
                  onChange={(e) => setSolveSpeed(parseInt(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* -------------------- TREE VISUALIZATION PANEL -------------------- */}
          <div>
            <SudokuTreeVisualization
              initialBoard={originalBoard}
              dfsPath={dfsPath}
              currentPathIndex={currentPathIndex}
              isSolving={isSolving}
            />
          </div>
        </div>

        {/* DFS Explanation Blocks */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">
            DFS Algorithm Explanation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">
                How Depth-First Search Works:
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-800">
                <li>Start with the initial puzzle state</li>
                <li>Find the first empty cell</li>
                <li>Try placing numbers 1-4 in order</li>
                <li>
                  For each valid placement, move to the next empty cell (going
                  deeper)
                </li>
                <li>
                  If no valid numbers can be placed, backtrack to the previous
                  cell
                </li>
                <li>Try the next valid number in that cell</li>
                <li>
                  Continue until all cells are filled (solution) or no
                  possibilities remain
                </li>
              </ol>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <h3 className="font-medium text-yellow-800 mb-2">
                Why Backtracking Occurs:
              </h3>
              <p className="text-sm text-yellow-800 mb-2">
                Backtracking happens when the algorithm reaches a dead-end:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-yellow-800">
                <li>
                  A number might be valid for the current cell but cause a
                  future conflict
                </li>
                <li>
                  The algorithm must undo (backtrack) when it finds the puzzle
                  is not solvable
                </li>
                <li>
                  In this 4x4 example, many “seemingly valid” placements can
                  fail later
                </li>
                <li>
                  The algorithm returns to earlier steps and tries new numbers
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">
              Visualization Legend:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-200 mr-2"></div>
                <span>Forward Move</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-200 mr-2"></div>
                <span>Backtracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 mr-2"></div>
                <span>Initial Numbers</span>
              </div>
              <div className="flex items-center">
                <svg width="20" height="10" className="mr-2">
                  <line
                    x1="0"
                    y1="5"
                    x2="20"
                    y2="5"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                </svg>
                <span>Backtrack Path</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sudoku4x4DFS;
