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
    if (!residualGraph[edge.target]) residualGraph[edge.target] = {};
    residualGraph[edge.target][edge.source] = 0;
  });

  // BFS amélioré pour Ford-Fulkerson
  const bfs = (source, target, parent) => {
    const visited = new Set();
    const queue = [source];
    visited.add(source);
    parent[source] = null;

    while (queue.length > 0) {
      const u = queue.shift();

      // Trier les voisins par capacité décroissante (optimisation)
      const neighbors = Object.keys(residualGraph[u])
        .filter((v) => !visited.has(v) && residualGraph[u][v] > 0)
        .sort((a, b) => residualGraph[u][b] - residualGraph[u][a]);

      for (const v of neighbors) {
        visited.add(v);
        parent[v] = u;
        queue.push(v);

        if (v === target) {
          return true;
        }
      }
    }

    return false;
  };

  let maxFlow = 0;
  const parent = {};
  const paths = [];

  // Algorithme principal Ford-Fulkerson
  while (bfs(sourceId, targetId, parent)) {
    // Trouver la capacité minimale le long du chemin
    let pathFlow = Infinity;
    const currentPath = [];
    let s = targetId;

    // Reconstruire le chemin
    while (s !== sourceId) {
      currentPath.unshift(s);
      pathFlow = Math.min(pathFlow, residualGraph[parent[s]][s]);
      s = parent[s];
    }
    currentPath.unshift(sourceId);

    paths.push({ path: currentPath, flow: pathFlow });

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
  const flowEdges = edges.map((edge) => {
    const originalCapacity = edge.capacity;
    const remainingCapacity = residualGraph[edge.source][edge.target];
    const flow = originalCapacity - remainingCapacity;

    return {
      ...edge,
      flow: Math.max(0, flow),
    };
  });

  return {
    maxFlow,
    flowEdges,
    paths: paths,
  };
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
  onViewGraph,
}) => {
  const renderResidualTable = () => {
    if (!residualTable || residualTable.length === 0) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Tableau de Résidu</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 font-medium">
                  Départ
                </th>
                <th className="border border-gray-300 px-3 py-2 font-medium">
                  Arrivée
                </th>
                <th className="border border-gray-300 px-3 py-2 font-medium">
                  Résidu
                </th>
                {Array.from(
                  {
                    length:
                      Math.max(...residualTable.map((r) => r.values.length)) -
                      1,
                  },
                  (_, i) => (
                    <th
                      key={i}
                      className="border border-gray-300 px-2 py-2 font-medium text-xs"
                    >
                      {i + 1}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {residualTable.map((edgeData, index) => {
                const sourceLabel =
                  nodes.find((n) => n.id === edgeData.source)?.label ||
                  edgeData.source;
                const targetLabel =
                  nodes.find((n) => n.id === edgeData.target)?.label ||
                  edgeData.target;
                const initialCapacity = edgeData.values[0];

                return (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">
                      {sourceLabel}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">
                      {targetLabel}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {initialCapacity}
                    </td>

                    {edgeData.values.slice(1).map((value, valueIndex) => {
                      const status = edgeData.statuses
                        ? edgeData.statuses[valueIndex + 1]
                        : "";
                      let displayValue = value;
                      let cellClass =
                        "border border-gray-300 px-2 py-2 text-center text-sm font-medium ";

                      if (status === "S") {
                        // Arc saturé : toute la capacité utilisée
                        displayValue = "S";
                        cellClass += "bg-yellow-100 text-yellow-800";
                      } else if (status === "B") {
                        // Arc bloqué : a de la capacité résiduelle mais ne peut plus être utilisé
                        displayValue = "B";
                        cellClass += "bg-red-100 text-red-800";
                      } else if (value === initialCapacity) {
                        // Arc pas encore utilisé
                        cellClass += "bg-white";
                      } else {
                        // Arc partiellement utilisé mais peut encore être utilisé
                        cellClass += "bg-green-100 text-green-800";
                      }

                      return (
                        <td key={valueIndex} className={cellClass}>
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Légende */}
        <div className="mt-4 flex gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
            <span>B = Bloqué (capacité restante mais inutilisable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300"></div>
            <span>S = Saturé (capacité entièrement utilisée)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
            <span>Partiellement utilisé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300"></div>
            <span>Pas encore utilisé</span>
          </div>
        </div>{" "}
      </div>
    );
  };

  const renderGraphPreview = (title, result, type) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button onClick={() => onViewGraph(type, result)} className="text-sm">
            Voir le Graphique →
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 min-h-[200px] flex items-center justify-center">
          <div className="space-y-2">
            <div className="text-2xl">📊</div>
            <p className="text-gray-600">Aperçu du graphique</p>
            <p className="text-sm text-gray-500">
              Flot maximal: {result?.maxFlow || 0}
            </p>
            {type === "residual" && result?.paths && (
              <p className="text-xs text-gray-400">
                {result.paths.length} chemins trouvés
              </p>
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
          <h1 className="text-2xl font-bold">
            Résultats - Flot Maximal: {maxFlow}
          </h1>
          <Button onClick={onBack} className="bg-blue-500 hover:bg-blue-600">
            Retour
          </Button>
        </div>

        {renderResidualTable()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderGraphPreview(
            "Graphique Résiduel (Manuel Bloch)",
            manuelBlochResult,
            "residual"
          )}
          {renderGraphPreview("Graphique Ford-Fulkerson", fordResult, "ford")}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Détails des Algorithmes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Manuel Bloch</h4>
              <p className="text-sm text-blue-700">
                Flot maximal: {manuelBlochResult?.maxFlow || 0}
              </p>
              <p className="text-xs text-blue-600">
                Chemins utilisés: {manuelBlochResult?.paths?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                Ford-Fulkerson
              </h4>
              <p className="text-sm text-green-700">
                Flot maximal: {fordResult?.maxFlow || 0}
              </p>
              <p className="text-xs text-green-600">
                Vérification du résultat optimal
              </p>
            </div>
          </div>
        </div>

        {/* Ajouter après le tableau résiduel */}
        {manuelBlochResult && manuelBlochResult.paths && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Chemins Augmentants Trouvés (Manuel Bloch)
            </h3>
            <div className="space-y-2">
              {manuelBlochResult.paths.map((pathInfo, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800">
                    Chemin {index + 1}:{" "}
                    {pathInfo.path
                      .map(
                        (nodeId) =>
                          nodes.find((n) => n.id === nodeId)?.label || nodeId
                      )
                      .join(" → ")}
                  </div>
                  <div className="text-sm text-blue-600">
                    Capacité utilisée: {pathInfo.capacity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fordResult && fordResult.paths && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Chemins Augmentants Trouvés (Ford-Fulkerson)
            </h3>
            <div className="space-y-2">
              {fordResult.paths.map((pathInfo, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">
                    Chemin {index + 1}:{" "}
                    {pathInfo.path
                      .map(
                        (nodeId) =>
                          nodes.find((n) => n.id === nodeId)?.label || nodeId
                      )
                      .join(" → ")}
                  </div>
                  <div className="text-sm text-green-600">
                    Flot envoyé: {pathInfo.flow}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GraphVisualization = ({
  type,
  result,
  nodes: originalNodes,
  edges: originalEdges,
  onBack,
}) => {
  console.log("GraphVisualization - Type:", type, "Result:", result);

  const getGraphTitle = () => {
    switch (type) {
      case "residual":
        return "Graphique Résiduel (Manuel Bloch)";
      case "ford":
        return "Graphique Ford-Fulkerson";
      default:
        return "Graphique";
    }
  };

  const getColoredEdges = () => {
    if (type === "residual" && result?.residualTable) {
      // Pour Manuel Bloch, calculer le flot à partir du tableau résiduel
      return originalEdges.map((edge) => {
        const edgeData = result.residualTable.find(
          (item) => item.source === edge.source && item.target === edge.target
        );

        if (edgeData && edgeData.values && edgeData.values.length > 1) {
          // Calculer le flot utilisé
          const originalCapacity = edgeData.values[0]; // Première valeur = capacité initiale
          const finalResidual = edgeData.values[edgeData.values.length - 1]; // Dernière valeur = capacité résiduelle finale
          const usedFlow = originalCapacity - finalResidual;
          
          // Déterminer la couleur basée sur le statut final
          const finalStatus = edgeData.statuses?.[edgeData.statuses.length - 1] || "";
          
          return {
            ...edge,
            flow: Math.max(0, usedFlow),
            color:
              finalStatus === "S"
                ? "#f59e0b" // Jaune pour Saturé
                : finalStatus === "B"
                ? "#ef4444" // Rouge pour Bloqué
                : usedFlow > 0
                ? "#10b981" // Vert pour partiellement utilisé
                : "#6b7280", // Gris pour non utilisé
          };
        }

        // Fallback si pas de données dans le tableau résiduel
        return {
          ...edge,
          flow: 0,
          color: "#6b7280",
        };
      });
    } else if (type === "ford" && result?.flowEdges) {
      // Pour Ford-Fulkerson
      return result.flowEdges.map((edge) => ({
        ...edge,
        color:
          edge.flow === edge.capacity
            ? "#f59e0b" // Jaune (Saturé)
            : edge.flow > 0
            ? "#ef4444" // Rouge (Utilisé)
            : "#6b7280", // Gris (Non utilisé)
      }));
    }

    // Par défaut
    return originalEdges.map((edge) => ({
      ...edge,
      color: "#6b7280",
      flow: 0,
    }));
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
                  <p>
                    <strong>Flot maximal:</strong> {result?.maxFlow || 0}
                  </p>
                  {type === "residual" && result?.paths && (
                    <p>
                      <strong>Chemins trouvés:</strong> {result.paths.length}
                    </p>
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
                    <span className="text-sm">
                      Arc bloqué (B) - A transporté du flot mais ne peut plus
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-yellow-500 rounded"></div>
                    <span className="text-sm">
                      Arc saturé (S) - Capacité entièrement utilisée
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-green-500 rounded"></div>
                    <span className="text-sm">Arc partiellement utilisé</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-gray-500 rounded"></div>
                    <span className="text-sm">Arc non utilisé</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails des arcs avec le flot */}
            <Card>
              <CardHeader>
                <CardTitle>Détails des Arcs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {coloredEdges
                    .filter((edge) => edge.flow > 0)
                    .map((edge, index) => {
                      const sourceLabel = originalNodes.find((n) => n.id === edge.source)?.label || edge.source;
                      const targetLabel = originalNodes.find((n) => n.id === edge.target)?.label || edge.target;
                      
                      return (
                        <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                          <strong>{sourceLabel} → {targetLabel}</strong>
                          <br />
                          Flot: {edge.flow}/{edge.capacity}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {type === "residual" && result?.paths && (
              <Card>
                <CardHeader>
                  <CardTitle>Chemins Utilisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {result.paths.map((pathInfo, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 bg-blue-50 rounded"
                      >
                        <strong>Chemin {index + 1}:</strong>
                        <br />
                        {pathInfo.path
                          .map(
                            (nodeId) =>
                              originalNodes.find((n) => n.id === nodeId)?.label
                          )
                          .join(" → ")}
                        <br />
                        <span className="text-blue-600">
                          Capacité: {pathInfo.capacity}
                        </span>
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
            style={{ minHeight: "600px" }}
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
              const source = originalNodes.find((n) => n.id === edge.source);
              const target = originalNodes.find((n) => n.id === edge.target);
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
                    stroke={edge.color || "#6b7280"}
                    strokeWidth="3"
                    markerEnd="url(#arrowhead-colored)"
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 10}
                    textAnchor="middle"
                    className="text-sm fill-gray-700 font-bold pointer-events-none"
                  >
                    {/* Affichage correct du flot/capacité */}
                    {edge.flow !== undefined
                      ? `${edge.flow}/${edge.capacity}`
                      : `${edge.capacity}`}
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
  const [currentView, setCurrentView] = useState("main"); // 'main', 'results', 'graph'
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

    // Tableau des états résiduels avec statut des arcs
    const residualStates = [];

    // État initial
    const initialState = {};
    edges.forEach((edge) => {
      const key = `${edge.source}-${edge.target}`;
      initialState[key] = {
        source: edge.source,
        target: edge.target,
        values: [edge.capacity], // Première colonne = capacité initiale
        statuses: [""], // Statuts pour chaque itération
      };
    });

    // Fonction pour vérifier si un arc peut encore être utilisé
    const canArcBeUsed = (from, to, currentGraph) => {
      if (currentGraph[from][to] <= 0) return false;

      // Faire un BFS pour voir si cet arc peut faire partie d'un chemin vers la cible
      const visited = new Set();
      const queue = [to]; // Commencer depuis la destination de l'arc
      visited.add(to);

      while (queue.length > 0) {
        const current = queue.shift();
        if (current === targetId) return true; // L'arc peut contribuer à un chemin

        for (const neighbor in currentGraph[current]) {
          if (!visited.has(neighbor) && currentGraph[current][neighbor] > 0) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      return false; // L'arc ne peut pas contribuer à un chemin vers la cible
    };

    // Algorithme Manuel Bloch avec DFS
    const findPath = () => {
      const visited = new Set();
      const path = [];

      const dfs = (node, target) => {
        if (node === target) return true;
        visited.add(node);
        path.push(node);

        for (const neighbor in residualGraph[node]) {
          if (!visited.has(neighbor) && residualGraph[node][neighbor] > 0) {
            if (dfs(neighbor, target)) return true;
          }
        }

        path.pop();
        return false;
      };

      if (dfs(sourceId, targetId)) {
        path.push(targetId);
        return path;
      }
      return null;
    };

    const allPaths = [];
    let totalFlow = 0;
    let iterationCount = 0;

    // Boucle principale
    let path;
    while ((path = findPath()) && iterationCount < 20) {
      // Calculer la capacité du chemin
      let pathCapacity = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        pathCapacity = Math.min(
          pathCapacity,
          residualGraph[path[i]][path[i + 1]]
        );
      }

      allPaths.push({ path: [...path], capacity: pathCapacity });

      // Mettre à jour le graphe résiduel
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        residualGraph[u][v] -= pathCapacity;
        residualGraph[v][u] += pathCapacity;
      }

      totalFlow += pathCapacity;

      // Sauvegarder l'état et déterminer les statuts
      edges.forEach((edge) => {
        const key = `${edge.source}-${edge.target}`;
        const currentResidual = residualGraph[edge.source][edge.target];
        const originalCapacity = edge.capacity;

        if (!initialState[key]) return;

        // Ajouter la nouvelle valeur résiduelle
        initialState[key].values.push(currentResidual);

        // Déterminer le statut
        let status = "";
        if (currentResidual === 0) {
          status = "S"; // Saturé : plus de capacité résiduelle
        } else if (currentResidual === originalCapacity) {
          status = ""; // Pas encore utilisé
        } else {
          // Vérifier si l'arc est bloqué (ne peut plus être utilisé)
          if (!canArcBeUsed(edge.source, edge.target, residualGraph)) {
            status = "B"; // Bloqué : a de la capacité mais ne peut plus être utilisé
          } else {
            status = ""; // Partiellement utilisé mais peut encore être utilisé
          }
        }

        initialState[key].statuses.push(status);
      });

      iterationCount++;
    }

    // Compléter le tableau avec les valeurs manquantes
    Object.values(initialState).forEach((edgeData) => {
      while (edgeData.values.length < iterationCount + 1) {
        edgeData.values.push(edgeData.values[edgeData.values.length - 1]);
        edgeData.statuses.push(edgeData.statuses[edgeData.statuses.length - 1]);
      }
    });

    const flowEdges = edges.map((edge) => {
      const originalCapacity = edge.capacity;
      const remainingCapacity = residualGraph[edge.source][edge.target];
      const flow = originalCapacity - remainingCapacity;
      return { ...edge, flow: Math.max(0, flow) };
    });

    return {
      maxFlow: totalFlow,
      flowEdges,
      paths: allPaths,
      residualTable: Object.values(initialState),
    };
  };

  const calculateMaxFlow = useCallback(() => {
    const sourceNode = nodes.find((node) => node.isSource);
    const targetNode = nodes.find((node) => node.isTarget);

    if (!sourceNode || !targetNode) {
      showNotification(
        "Veuillez définir une source et une destination",
        "error"
      );
      return;
    }

    if (sourceNode.id === targetNode.id) {
      showNotification(
        "La source et la destination ne peuvent pas être le même nœud",
        "error"
      );
      return;
    }

    setOriginalEdges([...edges]);

    try {
      // Exécuter Manuel Bloch
      const manuelResult = manuelBlochWithResidual(
        nodes,
        edges,
        sourceNode.id,
        targetNode.id
      );

      // Exécuter Ford-Fulkerson
      const fordResult = fordFulkerson(
        nodes,
        edges,
        sourceNode.id,
        targetNode.id
      );

      // Vérification des résultats
      const maxFlowValue = Math.max(manuelResult.maxFlow, fordResult.maxFlow);

      setManuelBlochResult(manuelResult);
      setFordResult(fordResult);
      setResidualTable(manuelResult.residualTable);
      setCurrentView("results");

      showNotification(`Flot maximal calculé: ${maxFlowValue}`, "success");
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      showNotification("Erreur lors du calcul du flot maximal", "error");
    }
  }, [nodes, edges]);

  const handleViewGraph = useCallback((type, result) => {
    setCurrentGraphType(type);
    setCurrentGraphResult(result);
    setCurrentView("graph");
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentView("main");
    setCurrentGraphType(null);
    setCurrentGraphResult(null);
  }, []);

  const handleBackToResults = useCallback(() => {
    setCurrentView("results");
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

    setShowResults(true);

    setCurrentView("results");
    setFordResult(null);
    setResidualTable(null);
  }, []);

  const getSourceNode = () => nodes.find((node) => node.isSource);
  const getTargetNode = () => nodes.find((node) => node.isTarget);

  const getEdgeColor = (edge) => {
    // Si on a des résultats de Manuel Bloch, utiliser les statuts
    if (manuelBlochResult?.residualTable) {
      const edgeData = manuelBlochResult.residualTable.find(
        (item) => item.source === edge.source && item.target === edge.target
      );

      if (edgeData && edgeData.statuses) {
        const finalStatus = edgeData.statuses[edgeData.statuses.length - 1];
        if (finalStatus === "S") return "#f59e0b"; // Jaune pour Saturé
        if (finalStatus === "B") return "#ef4444"; // Rouge pour Bloqué
      }
    }

    // Couleur par défaut
    if (edge.capacity === 0) {
      return "#000000"; // noir - capacité nulle
    }
    return "#6b7280"; // gris par défaut
  };
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

          let strokeColor = getEdgeColor(edge); // couleur par défaut

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
  if (currentView === "results") {
    return (
      <ResultsPage
        maxFlow={Math.max(
          manuelBlochResult?.maxFlow || 0,
          fordResult?.maxFlow || 0
        )}
        residualTable={residualTable}
        manuelBlochResult={manuelBlochResult}
        fordResult={fordResult}
        nodes={nodes}
        onBack={handleBackToMain}
        onViewGraph={handleViewGraph}
      />
    );
  }

  if (currentView === "graph") {
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
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">
          {" "}
          {/* Panneaux, Cartes et Boutons */}
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
