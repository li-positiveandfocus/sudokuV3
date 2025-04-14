import React, { useEffect, useState, useRef } from "react";

const SudokuTreeVisualization1 = ({
  initialBoard,
  dfsPath,
  currentPathIndex,
  isSolving,
}) => {
  const [treeNodes, setTreeNodes] = useState([]);
  const [treeLinks, setTreeLinks] = useState([]);
  const [activeNodePath, setActiveNodePath] = useState([]);
  const [backtrackExplanation, setBacktrackExplanation] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  const treeRef = useRef(null);
  const nodeRefs = useRef({});
  const [treeHeight, setTreeHeight] = useState(400);
  const [treeWidth, setTreeWidth] = useState(600);

  // ---------------------------------------------
  // 1. Board / Utility Methods
  // ---------------------------------------------
  const initialBoardState = () => {
    return (
      initialBoard || [
        [1, 0, 0, 0],
        [2, 0, 1, 0],
        [0, 2, 0, 0],
        [4, 0, 3, 1],
      ]
    );
  };

  const registerNodeRef = (nodeId, ref) => {
    if (!nodeRefs.current) nodeRefs.current = {};
    nodeRefs.current[nodeId] = ref;
  };

  const getNodeCenter = (nodeId) => {
    const nodeRef = nodeRefs.current[nodeId];
    if (!nodeRef || !treeRef.current) return null;

    const nodeRect = nodeRef.getBoundingClientRect();
    const treeRect = treeRef.current.getBoundingClientRect();

    return {
      x: nodeRect.left + nodeRect.width / 2 - treeRect.left,
      y: nodeRect.top + nodeRect.height / 2 - treeRect.top,
    };
  };

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

  const findEmptyCell = (board) => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          return [i, j];
        }
      }
    }
    return null; // no empty cell found
  };

  const copyBoard = (board) => {
    return board.map((row) => [...row]);
  };

  // ---------------------------------------------
  // 2. Backtracking Explanation
  // ---------------------------------------------
  /**
   * explainBacktracking: Tells us *which future cell* is unsolvable, and why
   * @param {number[][]} board        - the board state at the moment we notice a dead-end
   * @param {Object} step             - { row, col, value, ... } the step causing backtrack
   * @param {number[]} nextCell       - [r, c] the empty cell that had no valid options
   */
  const explainBacktracking = (board, step, nextCell) => {
    // nextCell must be an array [r, c]
    const [r, c] = nextCell;

    // Gather reasons that (r, c) can't fit ANY number from 1..4
    const reasons = [];
    for (let num = 1; num <= 4; num++) {
      // Row conflict
      for (let j = 0; j < 4; j++) {
        if (board[r][j] === num) {
          reasons.push(
            `${num} already exists in row ${r + 1} at column ${j + 1}`
          );
          break;
        }
      }
      // Column conflict
      for (let i = 0; i < 4; i++) {
        if (board[i][c] === num) {
          reasons.push(
            `${num} already exists in column ${c + 1} at row ${i + 1}`
          );
          break;
        }
      }
      // 2x2 box conflict
      const boxRow = Math.floor(r / 2) * 2;
      const boxCol = Math.floor(c / 2) * 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (board[boxRow + i][boxCol + j] === num) {
            reasons.push(
              `${num} already exists in the 2x2 box at (${boxRow + i + 1}, ${
                boxCol + j + 1
              })`
            );
            break;
          }
        }
      }
    }

    let explanation = `Backtracking from position (${step.row + 1}, ${
      step.col + 1
    }) with value ${step.value} because it led to an invalid state.\n`;

    explanation += `The algorithm can't continue because **for position (${
      r + 1
    }, ${c + 1}) there are no valid options**:\n`;

    if (reasons.length > 0) {
      explanation += "• " + [...new Set(reasons)].join("\n• ");
    } else {
      explanation += "All numbers 1..4 conflict in row, column, or box.";
    }

    return explanation;
  };

  // ---------------------------------------------
  // 3. Track Tree Dimensions
  // ---------------------------------------------
  useEffect(() => {
    const updateDimensions = () => {
      if (treeRef.current) {
        setTreeWidth(treeRef.current.clientWidth);
        setTreeHeight(treeRef.current.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // ---------------------------------------------
  // 4. Monitor DFS Path for backtracking steps
  // ---------------------------------------------
  useEffect(() => {
    if (dfsPath && currentPathIndex > 0 && currentPathIndex <= dfsPath.length) {
      const currentStep = dfsPath[currentPathIndex - 1];

      if (currentStep && currentStep.type === "backtrack") {
        // 1) Build board state up to this step - 1
        let boardState = copyBoard(initialBoardState());
        for (let i = 0; i < currentPathIndex - 1; i++) {
          const step = dfsPath[i];
          if (step.type === "forward") {
            boardState[step.row][step.col] = step.value;
          } else if (step.type === "backtrack") {
            boardState[step.row][step.col] = 0;
          }
        }

        // 2) Find the next empty cell that the solver can't fill
        const nextCell = findEmptyCell(boardState);

        // If nextCell is null, the code might say "puzzle is solved or no cell to fill"
        // But for demonstration, let's only show explanation if we do have a nextCell
        if (nextCell) {
          const explanation = explainBacktracking(
            boardState,
            currentStep,
            nextCell
          );
          setBacktrackExplanation(explanation);
          setShowExplanation(true);
        } else {
          setShowExplanation(false);
        }
      } else {
        // If not a backtrack step
        setShowExplanation(false);
      }
    } else {
      setShowExplanation(false);
    }
  }, [dfsPath, currentPathIndex, initialBoard]);

  // ---------------------------------------------
  // 5. Build Initial Tree Structure
  // ---------------------------------------------
  useEffect(() => {
    const board = initialBoardState();
    const nodes = [];
    const links = [];
    const nodePath = [];

    // Root node
    nodes.push({
      id: "root",
      label: "Start",
      depth: 0,
      childIndex: 0,
      totalChildren: 1,
      position: null,
      value: null,
      status: "active",
      parent: null,
    });

    nodePath.push("root");

    // Find the first empty cell
    const emptyCell = findEmptyCell(board);
    if (emptyCell) {
      const [row, col] = emptyCell;
      let validOptions = [];
      for (let num = 1; num <= 4; num++) {
        if (isValidPlacement(board, row, col, num)) {
          validOptions.push(num);
        }
      }

      validOptions.forEach((num, index) => {
        const nodeId = `node-${row}-${col}-${num}`;
        nodes.push({
          id: nodeId,
          label: `${num}`,
          depth: 1,
          childIndex: index,
          totalChildren: validOptions.length,
          position: [row, col],
          value: num,
          status: "unexplored",
          parent: "root",
        });
        links.push({
          source: "root",
          target: nodeId,
          status: "unexplored",
        });
      });
    }

    setTreeNodes(nodes);
    setTreeLinks(links);
    setActiveNodePath(nodePath);
  }, [initialBoard]);

  // ---------------------------------------------
  // 6. Update Tree as we move through dfsPath
  // ---------------------------------------------
  useEffect(() => {
    if (dfsPath && dfsPath.length > 0 && currentPathIndex > 0) {
      let currentBoard = copyBoard(initialBoardState());
      const newNodes = [...treeNodes];
      const newLinks = [...treeLinks];
      const newPath = ["root"];

      const nodeMap = {};
      newNodes.forEach((node) => {
        nodeMap[node.id] = node;
      });

      let lastNodeId = "root";

      for (let i = 0; i < currentPathIndex; i++) {
        const step = dfsPath[i];

        if (step.type === "forward") {
          const { row, col, value } = step;
          currentBoard[row][col] = value;

          const nodeId = `node-${row}-${col}-${value}`;
          if (nodeMap[nodeId]) {
            nodeMap[nodeId].status = "active";
            for (let j = 0; j < newLinks.length; j++) {
              if (newLinks[j].target === nodeId) {
                newLinks[j].status = "active";
                break;
              }
            }
          } else {
            // Not in nodeMap -> create new node
            const tempBoard = copyBoard(currentBoard);
            tempBoard[row][col] = 0; // revert to check valid options
            let validOptions = [];
            for (let num = 1; num <= 4; num++) {
              if (isValidPlacement(tempBoard, row, col, num)) {
                validOptions.push(num);
              }
            }
            const childIndex = validOptions.indexOf(value);

            const newNode = {
              id: nodeId,
              label: `${value}`,
              depth: newPath.length,
              childIndex: childIndex !== -1 ? childIndex : 0,
              totalChildren: validOptions.length,
              position: [row, col],
              value,
              status: "active",
              parent: lastNodeId,
            };
            newNodes.push(newNode);
            nodeMap[nodeId] = newNode;
            newLinks.push({
              source: lastNodeId,
              target: nodeId,
              status: "active",
            });
          }

          // Update path
          lastNodeId = nodeId;
          if (!newPath.includes(nodeId)) {
            newPath.push(nodeId);
          }

          // Next cell?
          const nextEmpty = findEmptyCell(currentBoard);
          if (nextEmpty) {
            const [r, c] = nextEmpty;
            let validOptions = [];
            for (let num = 1; num <= 4; num++) {
              if (isValidPlacement(currentBoard, r, c, num)) {
                validOptions.push(num);
              }
            }
            validOptions.forEach((n, idx) => {
              const childId = `node-${r}-${c}-${n}`;
              if (!nodeMap[childId]) {
                const childNode = {
                  id: childId,
                  label: `${n}`,
                  depth: newPath.length + 1,
                  childIndex: idx,
                  totalChildren: validOptions.length,
                  position: [r, c],
                  value: n,
                  status: "unexplored",
                  parent: lastNodeId,
                };
                newNodes.push(childNode);
                nodeMap[childId] = childNode;
                newLinks.push({
                  source: lastNodeId,
                  target: childId,
                  status: "unexplored",
                });
              }
            });
          }
        } else if (step.type === "backtrack") {
          const { row, col, value } = step;
          currentBoard[row][col] = 0;

          const nodeId = `node-${row}-${col}-${value}`;
          if (nodeMap[nodeId]) {
            nodeMap[nodeId].status = "failed";
            for (let j = 0; j < newLinks.length; j++) {
              if (
                newLinks[j].source === nodeId ||
                newLinks[j].target === nodeId
              ) {
                newLinks[j].status = "failed";
              }
            }
            const pathIndex = newPath.indexOf(nodeId);
            if (pathIndex !== -1) {
              newPath.splice(pathIndex, 1);
              lastNodeId = newPath[newPath.length - 1] || "root";
            }
          }
        }
      }

      setTreeNodes(newNodes);
      setTreeLinks(newLinks);
      setActiveNodePath(newPath);
    }
  }, [dfsPath, currentPathIndex, initialBoard, treeNodes, treeLinks]);

  // ---------------------------------------------
  // 7. Render Links
  // ---------------------------------------------
  const renderTreeLinks = () => {
    if (!treeRef.current || treeLinks.length === 0) return null;
    return treeLinks.map((link, index) => {
      const start = getNodeCenter(link.source);
      const end = getNodeCenter(link.target);
      if (!start || !end) return null;

      let stroke = "#94a3b8"; // default
      let strokeDasharray = "none";
      let strokeWidth = 1.5;

      if (link.status === "active") {
        stroke = "#10b981"; // green
        strokeWidth = 2.5;
      } else if (link.status === "failed") {
        stroke = "#ef4444"; // red
        strokeDasharray = "5,5";
        strokeWidth = 2;
      }

      return (
        <line
          key={`link-${index}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          markerEnd={`url(#${
            link.status === "failed" ? "arrow-failed" : "arrow-default"
          })`}
        />
      );
    });
  };

  // ---------------------------------------------
  // 8. Positioning Calculations
  // ---------------------------------------------
  const getNodesByDepth = () => {
    const nodesByDepth = {};
    treeNodes.forEach((node) => {
      if (!nodesByDepth[node.depth]) {
        nodesByDepth[node.depth] = [];
      }
      nodesByDepth[node.depth].push(node);
    });
    return nodesByDepth;
  };

  const calculateNodePositions = () => {
    const nodesByDepth = getNodesByDepth();
    const maxDepth = Math.max(...Object.keys(nodesByDepth).map(Number), 0);

    const levelHeight = Math.min(80, treeHeight / (maxDepth + 1));

    const positioned = treeNodes.map((node) => {
      const y = node.depth * levelHeight + 40;
      let x;
      if (node.id === "root") {
        x = treeWidth / 2;
      } else {
        const parentNode = treeNodes.find((n) => n.id === node.parent);
        if (parentNode) {
          const parentX = parentNode.x || treeWidth / 2;
          const totalSiblings = node.totalChildren;
          const siblingIndex = node.childIndex;
          const siblingAreaWidth = Math.min(300, treeWidth * 0.8);

          const offsetDirection =
            totalSiblings === 1 ? 0 : siblingIndex - (totalSiblings - 1) / 2;
          const stepSize = siblingAreaWidth / Math.max(totalSiblings, 1);

          x = parentX + offsetDirection * stepSize;
        } else {
          x = (node.childIndex + 1) * (treeWidth / (node.totalChildren + 1));
        }
      }

      return { ...node, x, y };
    });

    return positioned;
  };

  const getNodesInPath = () => {
    return activeNodePath.filter((id) => id);
  };

  // ---------------------------------------------
  // 9. Final Rendering
  // ---------------------------------------------
  const positionedNodes = calculateNodePositions();
  const nodesInPath = getNodesInPath();

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg h-full">
      <h2 className="text-lg font-semibold mb-3">DFS Search Tree</h2>
      <p className="text-sm text-gray-600 mb-4">
        This tree shows the decision paths explored by DFS. Green paths are
        being explored; red paths led to conflicts.
      </p>

      {/* Enhanced "Why Backtracking Occurs" explanation */}
      {showExplanation && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 text-sm mb-1">
            Why Backtracking Occurs
          </h3>
          <p className="text-xs text-red-700 whitespace-pre-line">
            {backtrackExplanation}
          </p>
        </div>
      )}

      <div
        className="relative bg-gray-50 border border-gray-200 rounded-lg"
        style={{ height: "350px", overflowX: "auto", overflowY: "auto" }}
        ref={treeRef}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-failed"
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
          {renderTreeLinks()}
        </svg>

        {/* Nodes */}
        <div className="absolute inset-0">
          {positionedNodes.map((node) => {
            let bgColor = "bg-gray-100";
            let textColor = "text-gray-700";
            let borderColor = "border-gray-300";
            let zIndex = 10;

            if (node.status === "active") {
              bgColor = "bg-green-100";
              textColor = "text-green-800";
              borderColor = "border-green-500";
              zIndex = 30;
            } else if (node.status === "failed") {
              bgColor = "bg-red-100";
              textColor = "text-red-800";
              borderColor = "border-red-500";
              zIndex = 20;
            }

            const isInActivePath = nodesInPath.includes(node.id);
            const shadowClass = isInActivePath
              ? "shadow-lg ring-2 ring-blue-400"
              : "shadow-md";

            return (
              <div
                key={node.id}
                ref={(el) => registerNodeRef(node.id, el)}
                className={`absolute ${bgColor} ${textColor} border-2 ${borderColor} rounded-full w-12 h-12 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 ${shadowClass} transition-all duration-300`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  zIndex: zIndex,
                }}
              >
                <div className="text-center">
                  <span className="font-bold text-lg">{node.label}</span>
                  {node.position && (
                    <span className="absolute -bottom-5 left-0 right-0 text-xs font-medium">
                      ({node.position[0] + 1},{node.position[1] + 1})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="font-medium text-blue-800 mb-2">
          How to Read the Tree:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-full mr-2"></div>
            <span>Unexplored Option</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-full mr-2"></div>
            <span>Current Path</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-full mr-2"></div>
            <span>Failed Path (Backtracked)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-blue-700">
          Each node shows the number placed and its position (row,column). When
          backtracking occurs, an explanation appears above the tree.
        </p>
      </div>
    </div>
  );
};

export default SudokuTreeVisualization1;
