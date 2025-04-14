import React, { useState, useEffect, useRef } from "react";

const Sudoku4x4DFS = () => {
  // A puzzle guaranteed to trigger backtracking
  const puzzlesWithBacktracking = [
    [
      [1, 0, 0, 0],
      [2, 0, 1, 0],
      [0, 2, 0, 0],
      [4, 0, 3, 1],
    ],
  ];

  // Randomly pick a predefined puzzle
  const generateInitialBoard = () => {
    return puzzlesWithBacktracking[
      Math.floor(Math.random() * puzzlesWithBacktracking.length)
    ];
  };

  // React state
  const [board, setBoard] = useState([]);
  const [originalBoard, setOriginalBoard] = useState([]);
  const [dfsPath, setDfsPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [solveSpeed, setSolveSpeed] = useState(2500);
  const [dfsExplanation, setDfsExplanation] = useState(
    "Click 'Run DFS Algorithm' to see how DFS solves Sudoku"
  );

  const [pathLines, setPathLines] = useState([]);
  const [visiblePathLines, setVisiblePathLines] = useState([]);
  const boardRef = useRef(null);
  const cellRefs = useRef({});

  // For live count of forward steps and backtracks during animation
  const [forwardStepCount, setForwardStepCount] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);

  // Initialize once
  useEffect(() => {
    startNewGame();
  }, []);

  const registerCellRef = (row, col, ref) => {
    if (!cellRefs.current) cellRefs.current = {};
    cellRefs.current[`${row},${col}`] = ref;
  };

  /**
   * Start a new puzzle game
   */
  const startNewGame = () => {
    const newBoard = generateInitialBoard();
    setBoard(newBoard.map((row) => [...row]));
    setOriginalBoard(newBoard.map((row) => [...row]));
    setDfsPath([]);
    setCurrentPathIndex(0);
    setIsSolving(false);
    setDfsExplanation("Click 'Run DFS Algorithm' to see how DFS solves Sudoku");
    setPathLines([]);
    setVisiblePathLines([]);
    // Reset the backtrack counter as well
    setBacktrackCount(0);
  };

  /**
   * Get the center of a cell for drawing lines
   */
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

  /**
   * Check if placing 'num' at 'board[row][col]' is valid
   */
  const checkPlacement = (board, row, col, num) => {
    // Check row
    for (let i = 0; i < 4; i++) {
      if (board[row][i] === num) {
        return `Row conflict: row ${row + 1} already has ${num}`;
      }
    }
    // Check column
    for (let i = 0; i < 4; i++) {
      if (board[i][col] === num) {
        return `Column conflict: column ${col + 1} already has ${num}`;
      }
    }
    // Check 2x2 box
    const boxRow = Math.floor(row / 2) * 2;
    const boxCol = Math.floor(col / 2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (board[boxRow + i][boxCol + j] === num) {
          return `Box conflict: the 2x2 box already has ${num}`;
        }
      }
    }
    return null;
  };

  /**
   * Run DFS and record each step for animation
   */
  const solveDFS = () => {
    const boardCopy = board.map((row) => [...row]);
    const path = [];
    const lines = [];
    let previousCell = null;

    // Before we start, reset path & indexes & backtrackCount
    setDfsPath([]);
    setCurrentPathIndex(0);
    setPathLines([]);
    setVisiblePathLines([]);
    setDfsExplanation("Starting DFS algorithm...");
    setBacktrackCount(0);

    const solve = (board, depth = 0) => {
      // Find first empty
      let emptyCell = null;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (board[r][c] === 0) {
            emptyCell = [r, c];
            break;
          }
        }
        if (emptyCell) break;
      }
      if (!emptyCell) {
        return true; // no empty => solved
      }

      const [row, col] = emptyCell;
      const currentCell = { row, col };

      if (previousCell !== null) {
        lines.push({
          from: previousCell,
          to: currentCell,
          type: "move",
          index: path.length,
        });
      }
      previousCell = currentCell;

      const numbersToTry = [1, 2, 3, 4];
      for (const num of numbersToTry) {
        const conflictReason = checkPlacement(board, row, col, num);
        if (conflictReason) {
          // invalid step
          path.push({
            type: "invalid",
            row,
            col,
            value: num,
            depth,
            explanation: `Cannot place ${num} at (${row + 1}, ${
              col + 1
            }): ${conflictReason}`,
          });
          continue;
        }
        // place it
        board[row][col] = num;
        path.push({
          type: "forward",
          row,
          col,
          value: num,
          depth,
          explanation: `Placing ${num} at (${row + 1}, ${col + 1})`,
        });

        if (solve(board, depth + 1)) {
          return true;
        }
        // if deeper recursion fails, backtrack
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
          }): removing ${num}`,
        });
      }

      previousCell = null;
      return false;
    };

    // Delay a bit to let UI render
    setTimeout(() => {
      solve(boardCopy);

      setDfsPath(path);
      setPathLines(lines);

      // Start animation if we have steps
      if (path.length > 0) {
        setIsSolving(true);
      }
    }, 100);
  };

  /**
   * Animate each step in dfsPath. If a step is 'backtrack',
   * we increment backtrackCount here so it's updated in real time.
   */
  useEffect(() => {
    if (isSolving && currentPathIndex < dfsPath.length) {
      const timer = setTimeout(() => {
        const step = dfsPath[currentPathIndex];
        const newBoard = board.map((row) => [...row]);

        if (step.type === "forward") {
          newBoard[step.row][step.col] = step.value;
          setForwardStepCount((prev) => prev + 1);
        } else if (step.type === "backtrack") {
          newBoard[step.row][step.col] = 0;
          // RELEVANT PART: increment the backtrack count in real time
          setBacktrackCount((prev) => prev + 1);
        }
        // "invalid" won't change the board

        // visible lines
        const visible = pathLines.filter(
          (line) => line.index <= currentPathIndex
        );
        setVisiblePathLines(visible);

        setBoard(newBoard);
        setDfsExplanation(step.explanation);
        setCurrentPathIndex(currentPathIndex + 1);
      }, solveSpeed);

      return () => clearTimeout(timer);
    } else if (isSolving && currentPathIndex >= dfsPath.length) {
      setIsSolving(false);
      if (dfsPath.length > 0) {
        const lastStep = dfsPath[dfsPath.length - 1];
        if (lastStep.type === "forward") {
          setDfsExplanation(
            "Solution found! DFS algorithm completed successfully."
          );
        } else {
          setDfsExplanation("No solution exists for this puzzle.");
        }
      }
    }
  }, [isSolving, currentPathIndex, dfsPath, board, solveSpeed, pathLines]);

  /**
   * Check if cell is currently highlighted
   */
  const isActiveCell = (row, col) => {
    if (
      !isSolving ||
      currentPathIndex === 0 ||
      currentPathIndex > dfsPath.length
    )
      return false;
    const currentStep = dfsPath[currentPathIndex - 1];
    return currentStep.row === row && currentStep.col === col;
  };

  const getCurrentStepType = () => {
    if (
      !isSolving ||
      currentPathIndex === 0 ||
      currentPathIndex > dfsPath.length
    )
      return null;
    return dfsPath[currentPathIndex - 1].type;
  };

  /**
   * Reset the DFS visualization
   */
  const resetDFS = () => {
    setIsSolving(false);
    setCurrentPathIndex(0);
    setBoard(originalBoard.map((row) => [...row]));
    setDfsExplanation(
      "Algorithm reset. Click 'Run DFS Algorithm' to start again."
    );
    setVisiblePathLines([]);
    // Also reset the forward and backtrack count
    setForwardStepCount(0);
    setBacktrackCount(0);
  };

  /**
   * Pause or resume
   */
  const toggleDFS = () => {
    setIsSolving(!isSolving);
  };

  /**
   * Render path lines in the SVG
   */
  const renderPathLines = () => {
    if (!boardRef.current || visiblePathLines.length === 0) return null;

    return visiblePathLines
      .map((line, index) => {
        const { from, to, type } = line;
        if (!from || !to) return null;

        const start = getCellCenter(from.row, from.col);
        const end = getCellCenter(to.row, to.col);
        if (!start || !end) return null;

        const color = type === "move" ? "#10b981" : "#ef4444"; // green / red
        const strokeWidth = 2;
        const dashArray = type === "backtrack" ? "5,5" : "none";
        const markerEnd =
          type === "move" ? "url(#arrowForward)" : "url(#arrowBacktrack)";

        return (
          <line
            key={`line-${index}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            markerEnd={markerEnd}
          />
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-bold mb-2">
          4x4 Sudoku DFS with Backtracking
        </h1>
        <p className="text-gray-600 mb-4">
          {isSolving
            ? `Visualizing DFS: Step ${currentPathIndex} of ${dfsPath.length}`
            : "Click 'Run DFS Algorithm' to see how DFS solves the puzzle with backtracking"}
        </p>

        {/* Board container */}
        <div className="flex justify-center mb-8 relative">
          {/* SVG overlay for lines */}
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

          {/* Sudoku board */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden z-0">
            <div className="grid grid-cols-4 gap-px bg-gray-300">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
                  const isActive = isActiveCell(rowIndex, colIndex);
                  const currentStepType = getCurrentStepType();

                  let bgColor = "bg-white";
                  if (isOriginal) {
                    bgColor = "bg-blue-50";
                  } else if (isActive) {
                    if (currentStepType === "forward") {
                      bgColor = "bg-green-200";
                    } else if (currentStepType === "backtrack") {
                      bgColor = "bg-red-200";
                    } else if (currentStepType === "invalid") {
                      bgColor = "bg-yellow-200";
                    }
                  }

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

        {/* Panel */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <h3 className="font-medium text-lg mb-2">DFS Status</h3>
          <p className="mb-3 text-gray-700">{dfsExplanation}</p>

          {/* Real-time backtrack count */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-blue-800 font-medium">Forward Steps</p>
              <p className="text-xl font-bold text-blue-600">
                {forwardStepCount}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              <p className="text-sm text-red-800 font-medium">
                Backtrack Steps
              </p>
              {/* Show the real-time count here */}
              <p className="text-xl font-bold text-red-600">{backtrackCount}</p>
            </div>
          </div>

          {isSolving && (
            <div className="mb-4">
              <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${(currentPathIndex / dfsPath.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
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

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={startNewGame}
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg shadow"
              disabled={isSolving}
            >
              New Game
            </button>

            <button
              onClick={solveDFS}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow"
              disabled={isSolving}
            >
              Run DFS Algorithm
            </button>

            <button
              onClick={toggleDFS}
              className="py-2 px-4 rounded-lg shadow bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={dfsPath.length === 0}
            >
              {isSolving ? "Pause" : "Play"}
            </button>

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
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-700">Animation Speed:</span>
            <input
              type="range"
              min="100"
              max="1000"
              step="100"
              value={solveSpeed}
              onChange={(e) => setSolveSpeed(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-700">{solveSpeed}ms</span>
          </div>
          <p className="text-xs text-gray-500">
            Lower value = faster animation
          </p>
        </div>

        {/* Legend */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">
            Path Visualization Legend
          </h2>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Path Line Types:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <svg width="40" height="20" className="mr-2">
                  <line
                    x1="5"
                    y1="10"
                    x2="35"
                    y2="10"
                    stroke="#10b981"
                    strokeWidth="2"
                    markerEnd="url(#arrowForward)"
                  />
                </svg>
                <span>Solid Green Arrow: Forward move (DFS exploration)</span>
              </div>
              <div className="flex items-center">
                <svg width="40" height="20" className="mr-2">
                  <line
                    x1="5"
                    y1="10"
                    x2="35"
                    y2="10"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowBacktrack)"
                  />
                </svg>
                <span>Dashed Red Arrow: Backtracking</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <h3 className="font-medium text-yellow-800 mb-2">
              How to Read the DFS Path:
            </h3>
            <p className="text-sm text-yellow-800 mb-2">
              The visualization shows the exact path the DFS algorithm takes
              through the solution space:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-yellow-800">
              <li>Green arrows are forward moves, placing numbers.</li>
              <li>Red dashed arrows are backtracking steps.</li>
              <li>
                The highlighted cell shows the current step:
                <ul className="list-disc pl-5">
                  <li>Green highlight = placing a number.</li>
                  <li>Red highlight = removing a number (backtrack).</li>
                  <li>Yellow highlight = tried a number but it was invalid.</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sudoku4x4DFS;
