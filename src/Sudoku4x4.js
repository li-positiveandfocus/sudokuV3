import React, { useState, useEffect } from "react";

const Sudoku4x4 = () => {
  // Initial 4x4 Sudoku board (0 represents empty cells)
  const generateInitialBoard = () => {
    // For simplicity, we'll just use a few predefined boards
    const puzzles = [
      [
        [1, 0, 0, 0],
        [2, 0, 1, 0],
        [0, 2, 0, 0],
        [4, 0, 3, 1],
      ],
      [
        [0, 2, 0, 4],
        [3, 0, 1, 0],
        [0, 1, 0, 3],
        [4, 0, 2, 0],
      ],
    ];
    // Randomly select one of the predefined puzzles
    return puzzles[Math.floor(Math.random() * puzzles.length)];
  };

  const [board, setBoard] = useState([]);
  const [originalBoard, setOriginalBoard] = useState([]);
  const [isGameWon, setIsGameWon] = useState(false);

  // Modal-related states
  const [showModal, setShowModal] = useState(false);
  const [modalRow, setModalRow] = useState(null);
  const [modalCol, setModalCol] = useState(null);

  // Invalid move popup states
  const [showInvalidMove, setShowInvalidMove] = useState(false);
  const [attemptedNumber, setAttemptedNumber] = useState(null);
  const [invalidMoveMessage, setInvalidMoveMessage] = useState("");

  // Initialize the game
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewGame = () => {
    const newBoard = generateInitialBoard();
    setBoard(newBoard.map((row) => [...row]));
    setOriginalBoard(newBoard.map((row) => [...row]));
    setIsGameWon(false);
  };

  // Check if the board is completely filled and valid
  const checkForWin = (currentBoard) => {
    // Check if the board is completely filled
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] === 0) {
          return false;
        }
      }
    }
    // Check if board is valid
    return isBoardValid(currentBoard);
  };

  // Check if the entire board is valid
  const isBoardValid = (currentBoard) => {
    // Check rows
    for (let i = 0; i < 4; i++) {
      const rowValues = new Set();
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] !== 0) {
          if (rowValues.has(currentBoard[i][j])) {
            return false;
          }
          rowValues.add(currentBoard[i][j]);
        }
      }
    }
    // Check columns
    for (let j = 0; j < 4; j++) {
      const colValues = new Set();
      for (let i = 0; i < 4; i++) {
        if (currentBoard[i][j] !== 0) {
          if (colValues.has(currentBoard[i][j])) {
            return false;
          }
          colValues.add(currentBoard[i][j]);
        }
      }
    }
    // Check 2x2 boxes
    for (let boxRow = 0; boxRow < 2; boxRow++) {
      for (let boxCol = 0; boxCol < 2; boxCol++) {
        const boxValues = new Set();
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            const value = currentBoard[boxRow * 2 + i][boxCol * 2 + j];
            if (value !== 0) {
              if (boxValues.has(value)) {
                return false;
              }
              boxValues.add(value);
            }
          }
        }
      }
    }
    return true;
  };

  // Check if a number can be placed at a specific position
  const isValidMove = (row, col, num) => {
    // Check row
    for (let j = 0; j < 4; j++) {
      if (board[row][j] === num) {
        return { valid: false, position: { row, col: j } };
      }
    }
    // Check column
    for (let i = 0; i < 4; i++) {
      if (board[i][col] === num) {
        return { valid: false, position: { row: i, col } };
      }
    }
    // Check 2x2 box
    const boxRow = Math.floor(row / 2) * 2;
    const boxCol = Math.floor(col / 2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (board[boxRow + i][boxCol + j] === num) {
          return {
            valid: false,
            position: { row: boxRow + i, col: boxCol + j },
          };
        }
      }
    }
    return { valid: true };
  };

  // Helper to get cell's 0-based index in row-major order
  const cellIndex = (row, col) => {
    return row * 4 + col;
  };

  // Clear user-filled cells that come after a given position in row-major order
  const clearCellsAfter = (row, col, currentBoard) => {
    const newBoard = JSON.parse(JSON.stringify(currentBoard)); // Deep copy
    const currentIndex = cellIndex(row, col);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (cellIndex(i, j) > currentIndex) {
          // Only clear non-original (user-filled) cells
          if (originalBoard[i][j] === 0) {
            newBoard[i][j] = 0;
          }
        }
      }
    }
    return newBoard;
  };

  // Handle click on a cell
  const handleCellClick = (row, col) => {
    // If it's an original cell (blue) or the game is won, do nothing
    if (originalBoard[row][col] !== 0 || isGameWon) {
      return;
    }
    setModalRow(row);
    setModalCol(col);
    setShowModal(true);
  };

  // Handle picking a number in the number-selection modal
  const handleNumberInput = (num) => {
    if (modalRow === null || modalCol === null) return;

    const validCheck = isValidMove(modalRow, modalCol, num);
    if (validCheck.valid) {
      let newBoard = JSON.parse(JSON.stringify(board));
      // Clear all subsequent user-filled cells
      newBoard = clearCellsAfter(modalRow, modalCol, newBoard);
      // Place the new number
      newBoard[modalRow][modalCol] = num;
      setBoard(newBoard);

      // Check for a win
      if (checkForWin(newBoard)) {
        setIsGameWon(true);
      }
      setShowModal(false);
      setModalRow(null);
      setModalCol(null);
    } else {
      // Close the number-selection modal
      setShowModal(false);

      // Prepare the invalid move message
      setAttemptedNumber(num);
      const conflictPos = validCheck.position;
      let errorMsg = "";

      if (conflictPos.row === modalRow) {
        errorMsg = `Number ${num} already exists in row ${
          conflictPos.row + 1
        } at column ${conflictPos.col + 1}`;
      } else if (conflictPos.col === modalCol) {
        errorMsg = `Number ${num} already exists in column ${
          conflictPos.col + 1
        } at row ${conflictPos.row + 1}`;
      } else {
        errorMsg = `Number ${num} already exists in the same 2x2 box at position (${
          conflictPos.row + 1
        }, ${conflictPos.col + 1})`;
      }
      setInvalidMoveMessage(errorMsg);
      setShowInvalidMove(true);
    }
  };

  // “Clear Number” button in the modal
  const handleClearCell = () => {
    if (modalRow === null || modalCol === null) return;
    let newBoard = JSON.parse(JSON.stringify(board));

    // Clear subsequent user-filled cells
    newBoard = clearCellsAfter(modalRow, modalCol, newBoard);
    // Clear this cell
    newBoard[modalRow][modalCol] = 0;
    setBoard(newBoard);

    setShowModal(false);
    setModalRow(null);
    setModalCol(null);
  };

  // Close the invalid move popup
  const closeInvalidMove = () => {
    setShowInvalidMove(false);
    // Reopen the number-selection modal for the same cell
    setShowModal(true);
  };

  // Cancel the number-selection modal
  const cancelModal = () => {
    setShowModal(false);
    setModalRow(null);
    setModalCol(null);
  };

  // ------------------------------------------------------------
  // Calculate the board's overall size:
  // Each cell is w-16 => 4rem in Tailwind. For 4 columns => 16rem total width.
  // Similarly 16rem total height for 4 rows. So the board is 16rem x 16rem.
  // We'll match the modal to that exact size using "w-[16rem] h-[16rem]".
  // ------------------------------------------------------------

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">4x4 Sudoku Game</h1>
      <p className="text-gray-600 mb-4">
        Click on empty (or non-blue) cells to fill or re-select numbers 1-4
      </p>

      {isGameWon && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg font-semibold">
          Congratulations! You've solved the puzzle!
        </div>
      )}

      {/* 
        Place the board and the "modal container" side by side. 
        We'll match the pop-up container size to the board's size.
      */}
      <div className="flex justify-center items-start mb-8 space-x-6">
        {/* The Sudoku board */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-px bg-gray-300">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                // Whether it's an original cell
                const isOriginal = originalBoard[rowIndex][colIndex] !== 0;

                // Background color
                let bgColor = "bg-white";
                if (isOriginal) {
                  bgColor = "bg-blue-50";
                }

                // Borders for 2x2 boxes
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
                    className={`flex items-center justify-center w-16 h-16 ${bgColor} ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} transition-colors duration-300 ${
                      !isOriginal && !isGameWon
                        ? "cursor-pointer hover:bg-gray-100"
                        : ""
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    <span
                      className={`text-2xl ${
                        isOriginal ? "font-bold text-blue-600" : "text-gray-700"
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

        {/* The popup container, same size as the board (16rem x 16rem) */}
        <div className="relative w-[16rem] h-[16rem] bg-gray-200 rounded-lg shadow-inner">
          {/* Show the Number Selection Modal if showModal is true */}
          {showModal && (
            <div className="absolute inset-0 bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Select a number</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-3 px-4 rounded"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                onClick={handleClearCell}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded mb-2"
              >
                Clear Number
              </button>
              <button
                onClick={cancelModal}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Show the Invalid Move Popup if showInvalidMove is true */}
          {showInvalidMove && (
            <div className="absolute inset-0 bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                Invalid Move
              </h3>
              <p className="text-gray-700 mb-4">
                You just tried number {attemptedNumber}, not valid. Please
                select another number.
              </p>
              <p className="text-gray-700 mb-4">{invalidMoveMessage}</p>
              <button
                onClick={closeInvalidMove}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* "New Game" button */}
      <button
        onClick={startNewGame}
        className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded-lg shadow"
      >
        New Game
      </button>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-4 max-w-xl text-gray-700">
        <h2 className="text-xl font-semibold mb-3">How to Play</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click on any empty cell to place a number (1-4).</li>
          <li>
            You can also click on filled cells (non-blue) to re-select or clear
            their numbers.
          </li>
          <li>
            Fill in numbers 1-4 so that no number repeats in any row, column, or
            2x2 box.
          </li>
          <li>The blue cells are fixed and cannot be changed.</li>
          <li>
            When you change or clear a number in a cell, all numbers placed
            after it (left to right, top to bottom) will be cleared.
          </li>
          <li>Solve the entire puzzle to win!</li>
        </ol>
      </div>
    </div>
  );
};

export default Sudoku4x4;
