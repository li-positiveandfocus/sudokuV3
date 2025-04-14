// Sudoku4x4BruteForce.js
import React, { useState } from "react";

/**
 * A naive brute-force solver for a 4x4 Sudoku. It tries all possible ways
 * to fill empty cells, then checks if the final board is valid.
 *
 * This example displays:
 *  - The initial puzzle
 *  - A "Solve Brute Force" button
 *  - The resulting solved board or a message if no solution is found
 */

// Helper function: Check if the board is valid
function isValidBoard(board) {
  // Check rows
  for (let r = 0; r < 4; r++) {
    const seen = new Set();
    for (let c = 0; c < 4; c++) {
      const val = board[r][c];
      if (val < 1 || val > 4) return false;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check columns
  for (let c = 0; c < 4; c++) {
    const seen = new Set();
    for (let r = 0; r < 4; r++) {
      const val = board[r][c];
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check 2x2 boxes
  for (let boxRow = 0; boxRow < 2; boxRow++) {
    for (let boxCol = 0; boxCol < 2; boxCol++) {
      const seen = new Set();
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const r = boxRow * 2 + i;
          const c = boxCol * 2 + j;
          const val = board[r][c];
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }
  // Passed all checks
  return true;
}

// The brute-force solver
function solveSudokuBruteForce(initialBoard) {
  // Deep copy the board so we don't mutate the original
  const board = initialBoard.map((row) => [...row]);

  // 1) Identify empty cells
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) {
        emptyCells.push([r, c]);
      }
    }
  }

  const k = emptyCells.length; // number of empty cells
  const totalCombinations = 4 ** k; // 4^k possible ways to fill them

  // 2) Enumerate each possible assignment
  for (let comboIdx = 0; comboIdx < totalCombinations; comboIdx++) {
    // Convert comboIdx to base-4
    let temp = comboIdx;
    const digits = [];
    for (let i = 0; i < k; i++) {
      const digitBase4 = temp % 4; // digit in [0..3]
      temp = Math.floor(temp / 4);
      // Convert to Sudoku digit [1..4]
      digits.push(digitBase4 + 1);
    }

    // Fill the board with these digits
    for (let i = 0; i < k; i++) {
      const [row, col] = emptyCells[i];
      board[row][col] = digits[i];
    }

    // Check if the board is valid
    if (isValidBoard(board)) {
      // Return the solved board
      return board;
    }
  }

  // If no valid assignment found, puzzle is unsolvable or no solution
  return null;
}

const Sudoku4x4BruteForce = () => {
  // This is a sample 4x4 puzzle
  const [puzzle, setPuzzle] = useState([
    [1, 0, 0, 0],
    [2, 0, 1, 0],
    [0, 2, 0, 0],
    [4, 0, 3, 1],
  ]);

  const [solution, setSolution] = useState(null);
  const [showSolved, setShowSolved] = useState(false);

  const handleSolveClick = () => {
    const result = solveSudokuBruteForce(puzzle);
    setSolution(result);
    setShowSolved(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">4x4 Sudoku Brute Force</h2>
      <p className="mb-4 text-gray-700">
        Below is a 4x4 Sudoku puzzle. Click the button to solve it via brute
        force: it tries <strong>all</strong> possible fillings of the empty
        cells, then checks which one is valid.
      </p>

      {/* Display the puzzle in a small 4x4 grid */}
      <div className="inline-block mr-8">
        <h3 className="font-semibold mb-2">Initial Puzzle</h3>
        <div className="bg-white rounded border border-gray-300 inline-block">
          {puzzle.map((row, rIdx) => (
            <div key={rIdx} className="flex">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className="w-12 h-12 flex items-center justify-center border border-gray-200"
                >
                  {cell === 0 ? "" : cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Solve button */}
      <div className="mb-6">
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
          onClick={handleSolveClick}
        >
          Solve Brute Force
        </button>
      </div>

      {/* Show the solution if user clicks */}
      {showSolved && (
        <div>
          {solution ? (
            <>
              <h3 className="font-semibold mb-2">Solved Puzzle</h3>
              <div className="bg-white rounded border border-gray-300 inline-block">
                {solution.map((row, rIdx) => (
                  <div key={rIdx} className="flex">
                    {row.map((cell, cIdx) => (
                      <div
                        key={cIdx}
                        className="w-12 h-12 flex items-center justify-center border border-gray-200"
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-red-600">
              No valid solution found for this puzzle.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Sudoku4x4BruteForce;
