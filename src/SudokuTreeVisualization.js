import React, { useEffect, useState, useRef } from "react";

const SudokuTreeVisualization = ({
  initialBoard,
  dfsPath,
  currentPathIndex,
  isSolving,
}) => {
  // ---------- State: Storing the Tree Data ----------
  const [treeNodes, setTreeNodes] = useState([]);
  const [treeLinks, setTreeLinks] = useState([]);
  const [activeNodePath, setActiveNodePath] = useState([]);

  // ---------- State: Backtracking Explanation ----------
  const [backtrackExplanation, setBacktrackExplanation] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  // ---------- Refs for Drawing the Tree ----------
  const treeRef = useRef(null);
  const nodeRefs = useRef({});

  // ---------- Dimensions for the Tree Container ----------
  const [treeHeight, setTreeHeight] = useState(400);
  const [treeWidth, setTreeWidth] = useState(600);

  // ---------------------------------------------
  // 1) Board/Utility Methods
  // ---------------------------------------------
  const initialBoardState = () => {
    // Default 4x4 if not passed in:
    return (
      initialBoard || [
        [1, 0, 0, 0],
        [2, 0, 1, 0],
        [0, 2, 0, 0],
        [4, 0, 3, 1],
      ]
    );
  };

  const copyBoard = (board) => board.map((row) => [...row]);

  const isValidPlacement = (board, row, col, num) => {
    // Row check
    for (let i = 0; i < 4; i++) {
      if (board[row][i] === num) return false;
    }
    // Column check
    for (let i = 0; i < 4; i++) {
      if (board[i][col] === num) return false;
    }
    // 2x2 box
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
    return null;
  };

  // For drawing lines between nodes
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

  // ---------------------------------------------
  // 2) Backtracking Explanation (with nextCell)
  // ---------------------------------------------
  /**
   * If we discover a backtrack, we can find the next empty cell that forced the solver
   * to backtrack (i.e., no valid numbers for that cell). Then mention it here:
   */
  const explainBacktracking = (boardState, step, nextCell) => {
    const [r, c] = nextCell; // must be an array [row, col]
    return (
      `Backtracking from position (${step.row + 1}, ${step.col + 1}) ` +
      `with value ${step.value} because it led to an invalid state.\n` +
      `The algorithm can't continue because for position (${r + 1}, ${
        c + 1
      }) ` +
      `there is no valid options.`
    );
  };

  // ---------------------------------------------
  // 3) Track the Tree Container Size
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

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // ---------------------------------------------
  // 4) If current step is backtrack, show explanation
  // ---------------------------------------------
  useEffect(() => {
    if (dfsPath && currentPathIndex > 0 && currentPathIndex <= dfsPath.length) {
      const currentStep = dfsPath[currentPathIndex - 1];

      if (currentStep && currentStep.type === "backtrack") {
        // Build board up to the step before this backtrack
        const boardState = copyBoard(initialBoardState());
        for (let i = 0; i < currentPathIndex - 1; i++) {
          const s = dfsPath[i];
          if (s.type === "forward") {
            boardState[s.row][s.col] = s.value;
          } else if (s.type === "backtrack") {
            boardState[s.row][s.col] = 0;
          }
        }

        // nextCell = the empty cell that triggered the backtrack (no valid numbers)
        const nextCell = findEmptyCell(boardState);
        if (nextCell) {
          const explanation = explainBacktracking(
            boardState,
            currentStep,
            nextCell
          );
          setBacktrackExplanation(explanation);
          setShowExplanation(true);
        } else {
          // If no nextCell is found, you might handle differently
          // e.g. "No more empty cells" => puzzle is solved or other special case
          setShowExplanation(false);
        }
      } else {
        setShowExplanation(false);
      }
    } else {
      setShowExplanation(false);
    }
  }, [dfsPath, currentPathIndex, initialBoard]);

  // ---------------------------------------------
  // 5) Build the Initial Tree (root + first moves)
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

    // First empty cell
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
          label: String(num),
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
  // 6) Update Tree According to dfsPath
  // ---------------------------------------------
  useEffect(() => {
    if (dfsPath && dfsPath.length > 0 && currentPathIndex > 0) {
      const newNodes = [...treeNodes];
      const newLinks = [...treeLinks];
      const newPath = ["root"];

      // Quick lookup
      const nodeMap = {};
      newNodes.forEach((n) => {
        nodeMap[n.id] = n;
      });

      // Rebuild board up to the current step
      const currentBoard = copyBoard(initialBoardState());
      let lastNodeId = "root";

      for (let i = 0; i < currentPathIndex; i++) {
        const step = dfsPath[i];

        if (step.type === "forward") {
          const { row, col, value } = step;
          currentBoard[row][col] = value;
          const nodeId = `node-${row}-${col}-${value}`;

          if (!nodeMap[nodeId]) {
            const newNode = {
              id: nodeId,
              label: String(value),
              depth: newPath.length,
              childIndex: 0,
              totalChildren: 1,
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
          } else {
            // Mark existing node active
            nodeMap[nodeId].status = "active";
            // Mark link as active
            for (let j = 0; j < newLinks.length; j++) {
              if (newLinks[j].target === nodeId) {
                newLinks[j].status = "active";
                break;
              }
            }
          }

          // >>> Key: we actually used (row,col)=value => lastNodeId = nodeId
          lastNodeId = nodeId;
          if (!newPath.includes(nodeId)) {
            newPath.push(nodeId);
          }

          // Find next empty cell => create child nodes from lastNodeId
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
                  label: String(n),
                  depth: newPath.length + 1,
                  childIndex: idx,
                  totalChildren: validOptions.length,
                  position: [r, c],
                  value: n,
                  status: "unexplored",
                  parent: lastNodeId, // ensures correct parent
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
          // handle backtracking
          const { row, col, value } = step;
          currentBoard[row][col] = 0;

          const nodeId = `node-${row}-${col}-${value}`;
          if (nodeMap[nodeId]) {
            nodeMap[nodeId].status = "failed";
            // Mark its links as failed
            for (let j = 0; j < newLinks.length; j++) {
              if (
                newLinks[j].source === nodeId ||
                newLinks[j].target === nodeId
              ) {
                newLinks[j].status = "failed";
              }
            }
            // remove from path
            const pathIdx = newPath.indexOf(nodeId);
            if (pathIdx !== -1) {
              newPath.splice(pathIdx, 1);
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
  // 7) Render the Links
  // ---------------------------------------------
  const renderTreeLinks = () => {
    if (!treeRef.current || treeLinks.length === 0) return null;
    return treeLinks.map((link, idx) => {
      const start = getNodeCenter(link.source);
      const end = getNodeCenter(link.target);
      if (!start || !end) return null;

      let stroke = "#94a3b8"; // default
      let dash = "none";
      let width = 1.5;

      if (link.status === "active") {
        stroke = "#10b981"; // green
        width = 2.5;
      } else if (link.status === "failed") {
        stroke = "#ef4444"; // red
        dash = "5,5";
        width = 2;
      }

      return (
        <line
          key={`link-${idx}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke}
          strokeWidth={width}
          strokeDasharray={dash}
          markerEnd={`url(#${
            link.status === "failed" ? "arrow-failed" : "arrow-default"
          })`}
        />
      );
    });
  };

  // ---------------------------------------------
  // 8) Calculating Positions / Layout
  // ---------------------------------------------
  const getNodesByDepth = () => {
    const depthMap = {};
    treeNodes.forEach((node) => {
      if (!depthMap[node.depth]) {
        depthMap[node.depth] = [];
      }
      depthMap[node.depth].push(node);
    });
    return depthMap;
  };

  const calculateNodePositions = () => {
    const nodesByDepth = getNodesByDepth();
    const maxDepth = Math.max(...Object.keys(nodesByDepth).map(Number), 0);
    const levelHeight = Math.min(80, treeHeight / (maxDepth + 1));

    return treeNodes.map((node) => {
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

          const offsetDir =
            totalSiblings === 1 ? 0 : siblingIndex - (totalSiblings - 1) / 2;
          const stepSize = siblingAreaWidth / Math.max(totalSiblings, 1);

          x = parentX + offsetDir * stepSize;
        } else {
          x = (node.childIndex + 1) * (treeWidth / (node.totalChildren + 1));
        }
      }
      return { ...node, x, y };
    });
  };

  const getNodesInPath = () => {
    return activeNodePath.filter((id) => id !== null && id !== undefined);
  };

  // ---------------------------------------------
  // 9) Render
  // ---------------------------------------------
  const positionedNodes = calculateNodePositions();
  const nodesInPath = getNodesInPath();

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg h-full">
      <h2 className="text-lg font-semibold mb-3">DFS Search Tree</h2>
      <p className="text-sm text-gray-600 mb-4">
        Shows the paths explored by DFS. Green = chosen path, Red = backtracked.
      </p>

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

        <div className="absolute inset-0">
          {positionedNodes.map((node) => {
            // Node style
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
                  zIndex,
                }}
              >
                <div className="text-center relative">
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
            <span>Unexplored</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-full mr-2"></div>
            <span>Active / Chosen</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-full mr-2"></div>
            <span>Failed (Backtracked)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-blue-700">
          Each node is labeled with the number placed and its (row,column). When
          backtracking occurs, you’ll see an explanation above the tree
          including “no valid options” for the next empty cell.
        </p>
      </div>
    </div>
  );
};

export default SudokuTreeVisualization;
