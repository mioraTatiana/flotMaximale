import React, { useState, useCallback, useRef, useEffect } from "react";


// Algorithme Ford-Fulkerson
const fordFulkerson = (nodes, edges, sourceId, targetId) => {
  // Construire le graphe résiduel
  const residualGraph = {};
  nodes.forEach((node) => {
    residualGraph[node.id] = {};
  });

  edges.forEach((edge) => {
    residualGraph[edge.source][edge.target] = edge.capacity;
    // Initialiser l'arête inverse avec capacité 0
    if (!residualGraph[edge.target]) residualGraph[edge.target] = {};
    residualGraph[edge.target][edge.source] = 0;
  });

  // BFS pour trouver un chemin augmentant
  const bfs = (source, target, parent) => {
    const visited = new Set();
    const queue = [source];
    visited.add(source);
    parent[source] = null;

    while (queue.length > 0) {
      const u = queue.shift();

      for (const v in residualGraph[u]) {
        if (!visited.has(v) && residualGraph[u][v] > 0) {
          visited.add(v);
          parent[v] = u;
          queue.push(v);

          if (v === target) {
            return true;
          }
        }
      }
    }

    return false;
  };

  let maxFlow = 0;
  const parent = {};

  // Tant qu'il existe un chemin augmentant
  while (bfs(sourceId, targetId, parent)) {
    // Trouver la capacité minimale le long du chemin
    let pathFlow = Infinity;
    let s = targetId;

    while (s !== sourceId) {
      pathFlow = Math.min(pathFlow, residualGraph[parent[s]][s]);
      s = parent[s];
    }

    // Ajouter le flot du chemin au flot total
    maxFlow += pathFlow;

    // Mettre à jour les capacités résiduelles
    let v = targetId;
    while (v !== sourceId) {
      const u = parent[v];
      residualGraph[u][v] -= pathFlow;
      residualGraph[v][u] += pathFlow;
      v = parent[v];
    }
  }

  // Calculer le flot final sur chaque arête
  const flowEdges = edges.map((edge, index) => {
    const originalCapacity = edge.capacity;
    const remainingCapacity = residualGraph[edge.source][edge.target];
    const flow = originalCapacity - remainingCapacity;

    return {
      ...edge,
      flow: Math.max(0, flow),
    };
  });

  return { maxFlow, flowEdges };
};

// Composants UI
const Button = ({
  onClick,
  children,
  disabled,
  variant = "default",
  className = "",
  ...props
}) => {
  const baseStyles =
    "px-6 py-2 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 bg-white text-gray-700",
    secondary: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const Separator = ({ className = "" }) => (
  <div className={`border-t border-gray-200 ${className}`} />
);

const showNotification = (message, type = "info") => {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
};

const ResultsPage = ({ 
  maxFlow, 
  residualTable, 
  manuelBlochResult, 
  fordResult, 
  nodes, 
  onBack, 
  onViewGraph 
}) => {
  const renderResidualTable = () => {
    if (!residualTable || residualTable.length === 0) return null;
    
    const finalResidual = residualTable[residualTable.length - 1].graph;
    const nodeIds = Object.keys(finalResidual).sort();

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Tableau de Résidu Final</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 font-medium"></th>
                {nodeIds.map(nodeId => (
                  <th key={nodeId} className="border border-gray-300 px-3 py-2 font-medium">
                    {nodes.find(n => n.id === nodeId)?.label || nodeId}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodeIds.map(fromNodeId => (
                <tr key={fromNodeId}>
                  <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">
                    {nodes.find(n => n.id === fromNodeId)?.label || fromNodeId}
                  </td>
                  {nodeIds.map(toNodeId => (
                    <td key={toNodeId} className="border border-gray-300 px-3 py-2 text-center">
                      {finalResidual[fromNodeId]?.[toNodeId] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGraphPreview = (title, result, type) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button 
            onClick={() => onViewGraph(type, result)}
            className="text-sm"
          >
            Voir le Graphique →
          </Button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 min-h-[200px] flex items-center justify-center">
          <div className="space-y-2">
            <div className="text-2xl">📊</div>
            <p className="text-gray-600">Aperçu du graphique</p>
            <p className="text-sm text-gray-500">Flot maximal: {result?.maxFlow || 0}</p>
            {type === 'manuel' && result?.paths && (
              <p className="text-xs text-gray-400">{result.paths.length} chemins trouvés</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Résultats - Flot Maximal: {maxFlow}</h1>
          <Button onClick={onBack} className="bg-blue-500 hover:bg-blue-600">
            Retour
          </Button>
        </div>

        {renderResidualTable()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderGraphPreview(
            "Graphique Résiduel (du Tableau)", 
            manuelBlochResult, 
            "residual"
          )}
          {renderGraphPreview(
            "Graphique Ford-Fulkerson", 
            fordResult, 
            "ford"
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Détails des Algorithmes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Manuel Bloch</h4>
              <p className="text-sm text-blue-700">Flot maximal: {manuelBlochResult?.maxFlow || 0}</p>
              <p className="text-xs text-blue-600">Chemins utilisés: {manuelBlochResult?.paths?.length || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Ford-Fulkerson</h4>
              <p className="text-sm text-green-700">Flot maximal: {fordResult?.maxFlow || 0}</p>
              <p className="text-xs text-green-600">Vérification du résultat optimal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GraphVisualization = ({ 
  type, 
  result, 
  nodes: originalNodes, 
  edges: originalEdges, 
  onBack 
}) => {
  const getGraphTitle = () => {
    switch(type) {
      case 'residual': return 'Graphique Résiduel (Manuel Bloch)';
      case 'ford': return 'Graphique Ford-Fulkerson';
      default: return 'Graphique';
    }
  };

  const getColoredEdges = () => {
    if (type === 'residual' && result?.residualTable) {
      const finalResidual = result.residualTable[result.residualTable.length - 1].graph;
      return originalEdges.map(edge => {
        const residualCapacity = finalResidual[edge.source]?.[edge.target] || 0;
        const usedCapacity = edge.capacity - residualCapacity;
        return {
          ...edge,
          flow: Math.max(0, usedCapacity),
          color: usedCapacity > 0 ? (usedCapacity === edge.capacity ? '#f59e0b' : '#10b981') : '#ef4444'
        };
      });
    } else if (type === 'ford' && result?.flowEdges) {
      return result.flowEdges.map(edge => ({
        ...edge,
        color: edge.flow > 0 ? (edge.flow === edge.capacity ? '#f59e0b' : '#10b981') : '#ef4444'
      }));
    }
    return originalEdges;
  };

  const coloredEdges = getColoredEdges();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">
          <div className="p-6 space-y-4">
            <Button onClick={onBack} className="w-full mb-4">
              ← Retour aux Résultats
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{getGraphTitle()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Flot maximal:</strong> {result?.maxFlow || 0}</p>
                  {type === 'residual' && result?.paths && (
                    <p><strong>Chemins trouvés:</strong> {result.paths.length}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Légende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-red-500 rounded"></div>
                    <span className="text-sm">Arête bloquée (flot = 0)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Arête saturée (flot = capacité)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-green-500 rounded"></div>
                    <span className="text-sm">Arête avec flot partiel</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {type === 'residual' && result?.paths && (
              <Card>
                <CardHeader>
                  <CardTitle>Chemins Utilisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {result.paths.map((pathInfo, index) => (
                      <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                        <strong>Chemin {index + 1}:</strong><br/>
                        {pathInfo.path.map(nodeId => 
                          originalNodes.find(n => n.id === nodeId)?.label
                        ).join(' → ')}<br/>
                        <span className="text-blue-600">Capacité: {pathInfo.capacity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <svg
            width="100%"
            height="100%"
            className="bg-gray-50"
            style={{ minHeight: '600px' }}
          >
            <defs>
              <marker
                id="arrowhead-colored"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
              </marker>
            </defs>

            {coloredEdges.map((edge, i) => {
              const source = originalNodes.find(n => n.id === edge.source);
              const target = originalNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const unitX = dx / length;
              const unitY = dy / length;

              const radius = 30;
              const startX = source.x + unitX * radius;
              const startY = source.y + unitY * radius;
              const endX = target.x - unitX * (radius + 10);
              const endY = target.y - unitY * (radius + 10);

              return (
                <g key={i}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={edge.color || '#6b7280'}
                    strokeWidth="3"
                    markerEnd="url(#arrowhead-colored)"
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 10}
                    textAnchor="middle"
                    className="text-sm fill-gray-700 font-bold pointer-events-none"
                  >
                    {edge.flow !== undefined ? `${edge.flow}/${edge.capacity}` : `${edge.capacity}`}
                  </text>
                </g>
              );
            })}

            {originalNodes.map((node, i) => (
              <g key={i}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="30"
                  fill={node.isSource ? "#16a34a" : node.isTarget ? "#ea580c" : "#219ebc"}
                  stroke={node.isSource ? "#152614" : node.isTarget ? "#dc2f02" : "#023047"}
                  strokeWidth="3"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontWeight="bold"
                  fontSize="14"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
// Composant principal
export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [originalEdges, setOriginalEdges] = useState([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [newNodeName, setNewNodeName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [manuelBlochResult, setManuelBlochResult] = useState(null);
  const canvasRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const [fordResult, setFordResult] = useState(null);
  const [residualTable, setResidualTable] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'results', 'graph'
const [currentGraphType, setCurrentGraphType] = useState(null);
const [currentGraphResult, setCurrentGraphResult] = useState(null);
  useEffect(() => {
    document.title = "Calculateur de Flot Maximal - Ford-Fulkerson";
    setMounted(true);
  }, []);
  const handleMouseDown = useCallback((event, node) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setIsDragging(true);
    setDraggedNode(node);
    setDragOffset({ x: x - node.x, y: y - node.y });
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMouseMove = useCallback(
    (event) => {
      if (!isDragging || !draggedNode || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggedNode.id
            ? { ...node, x: x - dragOffset.x, y: y - dragOffset.y }
            : node
        )
      );
    },
    [isDragging, draggedNode, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = useCallback(
    (event) => {
      if (!canvasRef.current || isDragging) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const clickedNode = nodes.find((node) => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= 30;
      });
      if (clickedNode) {
        if (
          isConnecting &&
          connectingFrom &&
          connectingFrom.id !== clickedNode.id
        ) {
          const edgeId = `edge-${connectingFrom.id}-${clickedNode.id}`;
          const existingEdge = edges.find((e) => e.id === edgeId);
          if (!existingEdge) {
            const newEdge = {
              id: edgeId,
              source: connectingFrom.id,
              target: clickedNode.id,
              capacity: 10,
              flow: 0,
            };
            setEdges((prev) => [...prev, newEdge]);
            showNotification("Arête créée", "success");
          } else {
            showNotification("Arête déjà existante", "error");
          }
          setIsConnecting(false);
          setConnectingFrom(null);
        } else {
          setSelectedNode(clickedNode);
          setSelectedEdge(null);
        }
      } else {
        const clickedEdge = edges.find((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return false;

          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          if (length === 0) return false;

          // Amélioration de la détection : zone de clic plus large
          const t = Math.max(
            0,
            Math.min(
              1,
              ((x - sourceNode.x) * dx + (y - sourceNode.y) * dy) /
                (length * length)
            )
          );
          const projX = sourceNode.x + t * dx;
          const projY = sourceNode.y + t * dy;
          const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

          return distance <= 15; // Zone de clic plus large
        });

        if (clickedEdge) {
          setSelectedEdge(clickedEdge);
          setSelectedNode(null);
        } else {
          const newNode = {
            id: `node-${nodeCounter}`,
            label: String.fromCharCode(64 + nodeCounter),
            x: x,
            y: y,
            isSource: false,
            isTarget: false,
          };
          setNodes((prev) => [...prev, newNode]);
          setNodeCounter((prev) => prev + 1);
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      }
    },
    [nodes, edges, isConnecting, connectingFrom, nodeCounter, isDragging]
  );

  const startConnection = useCallback((node) => {
    setIsConnecting(true);
    setConnectingFrom(node);
    showNotification("Cliquez sur un autre nœud pour créer une arête", "info");
  }, []);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setEdges((prev) =>
      prev.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setNodes((prev) => prev.filter((node) => node.id !== selectedNode.id));
    setSelectedNode(null);
    showNotification(`Nœud ${selectedNode.label} supprimé`, "success");
  }, [selectedNode]);

  const deleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
    showNotification("Arête supprimée", "success");
  }, [selectedEdge]);

  const setAsSource = useCallback(() => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        isSource: node.id === selectedNode.id,
        isTarget: node.id === selectedNode.id ? false : node.isTarget,
      }))
    );
    setSelectedNode(null);
    showNotification(
      `Nœud ${selectedNode.label} défini comme source`,
      "success"
    );
  }, [selectedNode]);

  const setAsTarget = useCallback(() => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        isTarget: node.id === selectedNode.id,
        isSource: node.id === selectedNode.id ? false : node.isSource,
      }))
    );
    setSelectedNode(null);
    showNotification(
      `Nœud ${selectedNode.label} défini comme destination`,
      "success"
    );
  }, [selectedNode]);

  const renameNode = useCallback(() => {
    if (!selectedNode || !newNodeName.trim()) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode.id
          ? { ...node, label: newNodeName.trim() }
          : node
      )
    );
    setNewNodeName("");
    setSelectedNode(null);
    showNotification("Nœud renommé avec succès", "success");
  }, [selectedNode, newNodeName]);

  const updateEdgeCapacity = useCallback(() => {
    if (!selectedEdge || !newCapacity.trim()) return;
    const capacity = parseInt(newCapacity);
    if (isNaN(capacity) || capacity < 0) {
      showNotification("Veuillez entrer une capacité valide", "error");
      return;
    }
    setEdges((prev) =>
      prev.map((edge) =>
        edge.id === selectedEdge.id ? { ...edge, capacity, flow: 0 } : edge
      )
    );
    setNewCapacity("");
    setSelectedEdge(null);
    showNotification("Capacité mise à jour", "success");
  }, [selectedEdge, newCapacity]);

  const manuelBlochWithResidual = (nodes, edges, sourceId, targetId) => {
    // Construire le graphe résiduel
    const residualGraph = {};
    nodes.forEach((node) => {
      residualGraph[node.id] = {};
    });

    edges.forEach((edge) => {
      residualGraph[edge.source][edge.target] = edge.capacity;
      if (!residualGraph[edge.target]) residualGraph[edge.target] = {};
      residualGraph[edge.target][edge.source] = 0;
    });

    // Sauvegarder l'état initial pour le tableau
    const initialResidual = JSON.parse(JSON.stringify(residualGraph));
    const residualSteps = [
      { step: 0, graph: JSON.parse(JSON.stringify(residualGraph)) },
    ];

    const findAugmentingPath = () => {
      const visited = new Set();
      const queue = [{ node: sourceId, path: [sourceId] }];
      visited.add(sourceId);

      while (queue.length > 0) {
        const { node, path } = queue.shift();
        if (node === targetId) return path;

        for (const neighbor in residualGraph[node]) {
          if (!visited.has(neighbor) && residualGraph[node][neighbor] > 0) {
            visited.add(neighbor);
            queue.push({ node: neighbor, path: [...path, neighbor] });
          }
        }
      }
      return null;
    };

    const getPathCapacity = (path) => {
      let minCapacity = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        minCapacity = Math.min(
          minCapacity,
          residualGraph[path[i]][path[i + 1]]
        );
      }
      return minCapacity;
    };

    const allPaths = [];
    const flowEdges = edges.map((edge) => ({ ...edge, flow: 0 }));
    let totalFlow = 0;
    let stepCounter = 1;

    let path;
    while ((path = findAugmentingPath()) !== null) {
      const pathCapacity = getPathCapacity(path);
      allPaths.push({ path: path, capacity: pathCapacity });

      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        residualGraph[u][v] -= pathCapacity;
        residualGraph[v][u] += pathCapacity;
      }

      totalFlow += pathCapacity;
      residualSteps.push({
        step: stepCounter,
        graph: JSON.parse(JSON.stringify(residualGraph)),
        path: path,
        flow: pathCapacity,
      });
      stepCounter++;
    }

    edges.forEach((edge, index) => {
      const originalCapacity = edge.capacity;
      const remainingCapacity = residualGraph[edge.source][edge.target];
      const flow = originalCapacity - remainingCapacity;
      flowEdges[index].flow = Math.max(0, flow);
    });

    const bestPath =
      allPaths.length > 0
        ? [...allPaths].sort((a, b) => b.capacity - a.capacity)[0]
        : null;

    return {
      maxFlow: totalFlow,
      flowEdges,
      paths: allPaths,
      recommendedPath: bestPath,
      residualTable: residualSteps,
    };
  };

const calculateMaxFlow = useCallback(() => {
  const sourceNode = nodes.find(node => node.isSource);
  const targetNode = nodes.find(node => node.isTarget);

  if (!sourceNode || !targetNode) {
    showNotification('Veuillez définir une source et une destination', 'error');
    return;
  }

  if (sourceNode.id === targetNode.id) {
    showNotification('La source et la destination ne peuvent pas être le même nœud', 'error');
    return;
  }

  setOriginalEdges([...edges]);

  // Exécuter l'algorithme Manuel Bloch avec tableau résiduel
  const manuelResult = manuelBlochWithResidual(nodes, edges, sourceNode.id, targetNode.id);
  
  // Exécuter Ford-Fulkerson
  const fordResult = fordFulkerson(nodes, edges, sourceNode.id, targetNode.id);

  // Stocker tous les résultats
  setManuelBlochResult(manuelResult);
  setFordResult(fordResult);
  setResidualTable(manuelResult.residualTable);
  setCurrentView('results');

  showNotification(`Calculs terminés!`, 'success');
}, [nodes, edges]);


const handleViewGraph = useCallback((type, result) => {
  setCurrentGraphType(type);
  setCurrentGraphResult(result);
  setCurrentView('graph');
}, []);

const handleBackToMain = useCallback(() => {
  setCurrentView('main');
  setCurrentGraphType(null);
  setCurrentGraphResult(null);
}, []);

const handleBackToResults = useCallback(() => {
  setCurrentView('results');
  setCurrentGraphType(null);
  setCurrentGraphResult(null);
}, []);
  const resetWorkspace = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setOriginalEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);

    setNodeCounter(1);
    setIsConnecting(false);
    setConnectingFrom(null);
    setManuelBlochResult(null);
    showNotification("Plan de travail réinitialisé", "success");
    setShowResults(false);
    setFordResult(null);
    setResidualTable(null);
  }, []);

  const getSourceNode = () => nodes.find((node) => node.isSource);
  const getTargetNode = () => nodes.find((node) => node.isTarget);

  const renderCanvas = () => {
    return (
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
        className="cursor-crosshair bg-gray-50"
        style={{ minHeight: "600px" }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {edges.map((edge, i) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;

          const radius = 30;
          const startX = source.x + unitX * radius;
          const startY = source.y + unitY * radius;
          const endX = target.x - unitX * (radius + 10); // Ajustement pour la flèche
          const endY = target.y - unitY * (radius + 10);

          let strokeColor = "#6b7280"; // couleur par défaut

          return (
            <g key={i}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                style={{ cursor: "pointer" }}
              />
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 10}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium pointer-events-none"
                style={{ userSelect: "none" }}
              >
                {edge.capacity}
              </text>
            </g>
          );
        })}
        {nodes.map((node, i) => (
          <g
            key={i}
            onMouseDown={(e) => handleMouseDown(e, node)}
            className="cursor-move"
          >
            <circle
              onDoubleClick={() => startConnection(node)}
              cx={node.x}
              cy={node.y}
              r="30"
              fill={
                node.isSource
                  ? "#16a34a"
                  : node.isTarget
                  ? "#ea580c"
                  : "#219ebc"
              }
              stroke={
                node.isSource
                  ? "#152614"
                  : node.isTarget
                  ? "#dc2f02"
                  : "#023047"
              }
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontWeight="bold"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  if (!mounted) return null;

  // SUPPRIMER L'ANCIEN RETURN ET LE REMPLACER PAR :
  
  // Rendu conditionnel selon la vue actuelle
  if (currentView === 'results') {
    return (
      <ResultsPage
        maxFlow={Math.max(manuelBlochResult?.maxFlow || 0, fordResult?.maxFlow || 0)}
        residualTable={residualTable}
        manuelBlochResult={manuelBlochResult}
        fordResult={fordResult}
        nodes={nodes}
        onBack={handleBackToMain}
        onViewGraph={handleViewGraph}
      />
    );
  }

  if (currentView === 'graph') {
    return (
      <GraphVisualization
        type={currentGraphType}
        result={currentGraphResult}
        nodes={nodes}
        edges={originalEdges.length > 0 ? originalEdges : edges}
        onBack={handleBackToResults}
      />
    );
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">          {/* Panneaux, Cartes et Boutons */}
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>État du Graphe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nœuds:</span>
                  <Badge variant="outline">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Arêtes:</span>
                  <Badge variant="outline">{edges.length}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Source:</span>
                  <Badge variant={getSourceNode() ? "default" : "secondary"}>
                    {getSourceNode()?.label || "Non définie"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Destination:</span>
                  <Badge variant={getTargetNode() ? "default" : "secondary"}>
                    {getTargetNode()?.label || "Non définie"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={calculateMaxFlow}
                  className="w-full"
                  disabled={!getSourceNode() || !getTargetNode()}
                >
                  Flot Maximal
                </Button>
                <Button
                  onClick={resetWorkspace}
                  variant="destructive"
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              </CardContent>
            </Card>

            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle>Nœud: {selectedNode.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <Input
                      placeholder="Nouveau nom"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && renameNode()}
                    />
                    <Button onClick={renameNode}>OK</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={setAsSource}
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Source
                    </Button>
                    <Button
                      onClick={setAsTarget}
                      variant="outline"
                      id="destination-button"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      Destination
                    </Button>
                  </div>
                  <Button
                    onClick={() => startConnection(selectedNode)}
                    variant="outline"
                    className="w-full"
                  >
                    Connecter à...
                  </Button>
                  <Button
                    onClick={deleteNode}
                    variant="destructive"
                    className="w-full"
                  >
                    Supprimer le nœud
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedEdge && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Arête: {selectedEdge.flow || 0}/{selectedEdge.capacity || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <Input
                      type="number"
                      placeholder="Capacité"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && updateEdgeCapacity()
                      }
                    />
                    <Button onClick={updateEdgeCapacity}>OK</Button>
                  </div>
                  <Button
                    onClick={deleteEdge}
                    variant="destructive"
                    className="w-full"
                  >
                    Supprimer l'arête
                  </Button>
                </CardContent>
              </Card>
            )}

            {manuelBlochResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analyse Manuel Bloch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Chemins trouvés:</strong>{" "}
                      {manuelBlochResult.paths.length}
                    </p>
                    {manuelBlochResult.recommendedPath && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="font-medium">Chemin recommandé:</p>
                        <p>
                          {manuelBlochResult.recommendedPath.path
                            .map(
                              (nodeId) =>
                                nodes.find((n) => n.id === nodeId)?.label
                            )
                            .join(" → ")}
                        </p>
                        <p>
                          Capacité: {manuelBlochResult.recommendedPath.capacity}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {showResults && residualTable && (
              <Card>
                <CardHeader>
                  <CardTitle>Tableau Résiduel (Manuel Bloch)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="max-h-60 overflow-y-auto text-xs">
                    {residualTable.map((step, index) => (
                      <div key={index} className="mb-3 p-2 border rounded">
                        <p className="font-medium">Étape {step.step}</p>
                        {step.path && (
                          <p className="text-blue-600">
                            Chemin:{" "}
                            {step.path
                              .map(
                                (nodeId) =>
                                  nodes.find((n) => n.id === nodeId)?.label
                              )
                              .join(" → ")}{" "}
                            (Flot: {step.flow})
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {Object.entries(step.graph).map(
                            ([from, connections]) =>
                              Object.entries(connections).map(
                                ([to, capacity]) =>
                                  capacity > 0 ? (
                                    <span
                                      key={`${from}-${to}`}
                                      className="text-xs"
                                    >
                                      {nodes.find((n) => n.id === from)?.label}→
                                      {nodes.find((n) => n.id === to)?.label}:{" "}
                                      {capacity}
                                    </span>
                                  ) : null
                              )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {showResults && manuelBlochResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Graphe Manuel Bloch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p>
                      <strong>Flot maximal:</strong> {manuelBlochResult.maxFlow}
                    </p>
                    <p>
                      <strong>Chemins utilisés:</strong>{" "}
                      {manuelBlochResult.paths.length}
                    </p>
                    <div className="mt-2 space-y-1">
                      {manuelBlochResult.paths
                        .slice(0, 3)
                        .map((pathInfo, index) => (
                          <div
                            key={index}
                            className="text-xs p-1 bg-blue-50 rounded"
                          >
                            {pathInfo.path
                              .map(
                                (nodeId) =>
                                  nodes.find((n) => n.id === nodeId)?.label
                              )
                              .join(" → ")}{" "}
                            ({pathInfo.capacity})
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showResults && fordResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Graphe Ford-Fulkerson</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p>
                      <strong>Flot maximal:</strong> {fordResult.maxFlow}
                    </p>
                    <div className="mt-2 space-y-1">
                      {fordResult.flowEdges
                        .filter((e) => e.flow > 0)
                        .map((edge, index) => (
                          <div
                            key={index}
                            className="text-xs p-1 bg-green-50 rounded"
                          >
                            {nodes.find((n) => n.id === edge.source)?.label} →{" "}
                            {nodes.find((n) => n.id === edge.target)?.label}:{" "}
                            {edge.flow}/{edge.capacity}
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/*<Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Cliquez</strong> sur le canevas pour ajouter un nœud</p>
                <p>• <strong>Cliquez</strong> sur un nœud pour le sélectionner</p>
                <p>• <strong>Glissez</strong> un nœud pour le déplacer</p>
                <p>• <strong>Double-cliquez</strong> sur un nœud pour créer une arête</p>
                <p>• <strong>Cliquez</strong> sur une arête pour la modifier</p>
                <p>• Utilisez les boutons "Supprimer" pour effacer</p>
                <p>• Définissez une source et une destination</p>
                <p>• Calculez le flot maximal</p>
              </CardContent>
            </Card>*/}

          </div>
        </div>
        <div className="flex-1 relative">{renderCanvas()}</div>
      </div>
    </div>
  );
}
