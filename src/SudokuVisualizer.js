import React, { useState, useEffect } from "react";

const SudokuVisualizer = () => {
  // Initial Sudoku board
  const initialBoard = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  const [board, setBoard] = useState(initialBoard);
  const [originalBoard, setOriginalBoard] = useState(initialBoard);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(500); // Animation speed (milliseconds)
  const [difficulty, setDifficulty] = useState(0.6); // Sudoku difficulty, higher value means more empty cells
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("Initial State");

  // Check if a number is valid at a certain position
  const isValid = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  };

  // Find an empty cell
  const findEmpty = (board) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) return [i, j];
      }
    }
    return null;
  };

  // Deep copy of the Sudoku board
  const copyBoard = (board) => {
    return board.map((row) => [...row]);
  };

  // DFS to solve Sudoku
  const solveDFS = () => {
    const newSteps = [];
    const newBoard = copyBoard(originalBoard);

    const solve = (board) => {
      const find = findEmpty(board);
      if (!find) return true; // No empty cells, puzzle solved

      const [row, col] = find;

      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          board[row][col] = num;

          // Record attempt
          newSteps.push({
            board: copyBoard(board),
            position: [row, col],
            value: num,
            type: "attempt",
            message: `Attempting to place ${num} at position (${row + 1},${
              col + 1
            })`,
          });

          if (solve(board)) {
            return true;
          }

          // Backtrack
          board[row][col] = 0;

          // Record backtracking
          newSteps.push({
            board: copyBoard(board),
            position: [row, col],
            value: 0,
            type: "backtrack",
            message: `Backtracking: Removing ${num} from position (${row + 1},${
              col + 1
            })`,
          });
        }
      }

      return false;
    };

    // Add initial state
    newSteps.push({
      board: copyBoard(newBoard),
      type: "initial",
      message: "Initial State",
    });

    // Solve the Sudoku
    const result = solve(newBoard);

    // Add final state
    if (result) {
      newSteps.push({
        board: copyBoard(newBoard),
        type: "final",
        message: "Sudoku Solved!",
      });
    } else {
      newSteps.push({
        board: copyBoard(newBoard),
        type: "impossible",
        message: "Cannot solve this Sudoku!",
      });
    }

    setSteps(newSteps);
    setCurrentStep(0);
    setMessage(newSteps[0].message);
    setBoard(copyBoard(newSteps[0].board));
  };

  // Initialize
  useEffect(() => {
    solveDFS();
  }, []);

  // Handle auto-play
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < steps.length - 1) {
      timer = setTimeout(() => {
        nextStep();
      }, speed);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  // Next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setBoard(copyBoard(steps[nextStep].board));
      setMessage(steps[nextStep].message);
    }
  };

  // Previous step
  const prevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setBoard(copyBoard(steps[prevStep].board));
      setMessage(steps[prevStep].message);
    }
  };

  // Play/Pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Generate random Sudoku board
  const generateRandomBoard = () => {
    // Create empty Sudoku board
    const newBoard = Array(9)
      .fill()
      .map(() => Array(9).fill(0));

    // Solve a complete Sudoku
    const solveBoard = (board) => {
      const find = findEmpty(board);
      if (!find) return true;

      const [row, col] = find;

      // Create random order of numbers 1-9
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }

      for (const num of nums) {
        if (isValid(board, row, col, num)) {
          board[row][col] = num;

          if (solveBoard(board)) {
            return true;
          }

          board[row][col] = 0;
        }
      }

      return false;
    };

    // Remove some numbers to create a puzzle
    const removeNumbers = (board, difficultyLevel = difficulty) => {
      const cellsToRemove = Math.floor(81 * difficultyLevel);
      const positions = [];

      // Create a list of all positions
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          positions.push([i, j]);
        }
      }

      // Shuffle positions
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      // Remove numbers
      for (let i = 0; i < cellsToRemove; i++) {
        if (i < positions.length) {
          const [row, col] = positions[i];
          board[row][col] = 0;
        }
      }
    };

    // Generate random Sudoku
    solveBoard(newBoard);
    removeNumbers(newBoard);

    return newBoard;
  };

  // Restart - generate a new random Sudoku
  const restart = () => {
    const newInitialBoard = generateRandomBoard();
    setOriginalBoard(newInitialBoard);

    // Re-solve with new initial board
    const newSteps = [];
    const boardToSolve = copyBoard(newInitialBoard);

    // Add initial state
    newSteps.push({
      board: copyBoard(newInitialBoard),
      type: "initial",
      message: "New Random Sudoku - Initial State",
    });

    // Solve Sudoku
    const solve = (board) => {
      const find = findEmpty(board);
      if (!find) return true;

      const [row, col] = find;

      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          board[row][col] = num;

          newSteps.push({
            board: copyBoard(board),
            position: [row, col],
            value: num,
            type: "attempt",
            message: `Attempting to place ${num} at position (${row + 1},${
              col + 1
            })`,
          });

          if (solve(board)) {
            return true;
          }

          board[row][col] = 0;

          newSteps.push({
            board: copyBoard(board),
            position: [row, col],
            value: 0,
            type: "backtrack",
            message: `Backtracking: Removing ${num} from position (${row + 1},${
              col + 1
            })`,
          });
        }
      }

      return false;
    };

    const result = solve(boardToSolve);

    if (result) {
      newSteps.push({
        board: copyBoard(boardToSolve),
        type: "final",
        message: "Sudoku Solved!",
      });
    } else {
      newSteps.push({
        board: copyBoard(boardToSolve),
        type: "impossible",
        message: "Cannot solve this Sudoku!",
      });
    }

    setSteps(newSteps);
    setCurrentStep(0);
    setBoard(copyBoard(newSteps[0].board));
    setMessage(newSteps[0].message);
    setIsPlaying(false);
  };

  // Adjust speed
  const changeSpeed = (e) => {
    setSpeed(1000 - parseInt(e.target.value, 10));
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Sudoku Solver - DFS Visualization
      </h1>
      <p className="text-gray-600 mb-4">
        Click the "Generate Random Sudoku" button to create a new random Sudoku
        puzzle
      </p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-9 gap-px bg-gray-300">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  // Determine cell type
                  const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
                  const isHighlighted =
                    steps[currentStep]?.position &&
                    steps[currentStep].position[0] === rowIndex &&
                    steps[currentStep].position[1] === colIndex;
                  const isAttempt =
                    isHighlighted && steps[currentStep]?.type === "attempt";
                  const isBacktrack =
                    isHighlighted && steps[currentStep]?.type === "backtrack";

                  // Determine background color
                  let bgColor = "bg-white";
                  if (isHighlighted) {
                    bgColor = isAttempt ? "bg-green-200" : "bg-red-200";
                  } else if (isOriginal) {
                    bgColor = "bg-blue-50";
                  }

                  // Determine cell borders
                  const borderTop =
                    rowIndex % 3 === 0
                      ? "border-t-2 border-gray-800"
                      : "border-t border-gray-300";
                  const borderBottom =
                    rowIndex === 8
                      ? "border-b-2 border-gray-800"
                      : rowIndex % 3 === 2
                      ? "border-b-2 border-gray-800"
                      : "border-b border-gray-300";
                  const borderLeft =
                    colIndex % 3 === 0
                      ? "border-l-2 border-gray-800"
                      : "border-l border-gray-300";
                  const borderRight =
                    colIndex === 8
                      ? "border-r-2 border-gray-800"
                      : colIndex % 3 === 2
                      ? "border-r-2 border-gray-800"
                      : "border-r border-gray-300";

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`flex items-center justify-center w-8 h-8 ${bgColor} ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} transition-colors duration-300`}
                    >
                      <span
                        className={`text-lg ${
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

          <div className="mt-6">
            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-gray-700">{message}</p>
              <p className="mt-2 text-sm text-gray-500">
                Step: {currentStep + 1} / {steps.length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Control Panel</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speed Control
              </label>
              <input
                type="range"
                min="100"
                max="900"
                step="100"
                value={1000 - speed}
                onChange={changeSpeed}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Random Sudoku Difficulty
                </label>
                <span className="text-xs text-gray-500">
                  (Applied when regenerating)
                </span>
              </div>
              <select
                onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="0.4">Easy (about 32 clues)</option>
                <option value="0.6" selected>
                  Medium (about 20 clues)
                </option>
                <option value="0.75">Hard (about 17 clues)</option>
                <option value="0.85">Expert (about 12 clues)</option>
              </select>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              <button
                onClick={restart}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
              >
                Generate Random Sudoku
              </button>

              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex-1 py-2 px-4 rounded ${
                  currentStep === 0
                    ? "bg-gray-200 text-gray-400"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Previous
              </button>

              <button
                onClick={togglePlay}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className={`flex-1 py-2 px-4 rounded ${
                  currentStep === steps.length - 1
                    ? "bg-gray-200 text-gray-400"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Next
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">
                DFS Search Process Explanation
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                How Depth-First Search (DFS) works in Sudoku:
              </p>
              <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
                <li>Find an empty cell</li>
                <li>Try placing numbers 1-9</li>
                <li>
                  Check if the number is valid (no duplicates in row, column, or
                  3x3 box)
                </li>
                <li>If valid, recursively solve the remaining puzzle</li>
                <li>If unsolvable, backtrack and try another number</li>
              </ol>
              <div className="mt-3 text-sm">
                <p>
                  <span className="inline-block w-3 h-3 bg-green-200 mr-1"></span>{" "}
                  <span className="text-gray-600">
                    Green: Attempting a number
                  </span>
                </p>
                <p>
                  <span className="inline-block w-3 h-3 bg-red-200 mr-1"></span>{" "}
                  <span className="text-gray-600">Red: Backtracking</span>
                </p>
                <p>
                  <span className="inline-block w-3 h-3 bg-blue-50 mr-1"></span>{" "}
                  <span className="text-gray-600">
                    Blue: Original clue numbers
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SudokuVisualizer;
