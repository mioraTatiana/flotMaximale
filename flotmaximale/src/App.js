// App.js
import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

// Composants personnalisés
import NodeContextMenu from './components/NodeContextMenu';
import EdgeContextMenu from './components/EdgeContextMenu';
import CustomNode from './components/CustomNode';
import ControlPanel from './components/ControlPanel';
import { fordFulkerson } from './algorithms/fordFulkerson';

// Types de nœuds personnalisés
const nodeTypes = {
  custom: CustomNode,
};

const App = () => {
  // États pour les nœuds et les arêtes
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // États pour les menus contextuels
  const [nodeMenu, setNodeMenu] = useState({ visible: false, node: null, position: { x: 0, y: 0 } });
  const [edgeMenu, setEdgeMenu] = useState({ visible: false, edge: null, position: { x: 0, y: 0 } });
  
  // État pour suivre la source et la destination
  const [sourceNode, setSourceNode] = useState(null);
  const [sinkNode, setSinkNode] = useState(null);
  
  // État pour afficher le graphe original ou le graphe avec flot
  const [showFlowGraph, setShowFlowGraph] = useState(false);
  
  // État pour stocker le résultat du flot maximal
  const [maxFlowResult, setMaxFlowResult] = useState({ maxFlow: 0, flowGraph: null });
  
  // Référence au conteneur ReactFlow
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // ID pour les nouveaux nœuds
  const [nodeId, setNodeId] = useState(1);
  
  // Gestion de la connexion des arêtes
  const onConnect = useCallback((params) => {
    // Ajouter une capacité par défaut à l'arête
    const newEdge = {
      ...params,
      type: 'default',
      animated: false,
      label: '0/25',
      data: { capacity: 25, flow: 0 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);
  
  // Initialisation de ReactFlow
  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);
  
  // Ajout d'un nouveau nœud
  const onAddNode = useCallback(() => {
    const id = `${nodeId}`;
    const newNode = {
      id,
      type: 'custom',
      position: { x: 250, y: 250 },
      data: { 
        label: id, 
        isSource: false, 
        isSink: false 
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeId((prevId) => prevId + 1);
  }, [nodeId, setNodes]);
  
  // Gestion du clic sur un nœud
  const onNodeClick = useCallback((event, node) => {
    event.preventDefault();
    setNodeMenu({
      visible: true,
      node,
      position: { x: event.clientX, y: event.clientY },
    });
    setEdgeMenu({ visible: false, edge: null, position: { x: 0, y: 0 } });
  }, []);
  
  // Gestion du clic sur une arête
  const onEdgeClick = useCallback((event, edge) => {
    event.preventDefault();
    setEdgeMenu({
      visible: true,
      edge,
      position: { x: event.clientX, y: event.clientY },
    });
    setNodeMenu({ visible: false, node: null, position: { x: 0, y: 0 } });
  }, []);
  
  // Fermeture des menus contextuels
  const closeContextMenus = useCallback(() => {
    setNodeMenu({ visible: false, node: null, position: { x: 0, y: 0 } });
    setEdgeMenu({ visible: false, edge: null, position: { x: 0, y: 0 } });
  }, []);
  
  // Définir un nœud comme source
  const setAsSource = useCallback((nodeId) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSource: n.id === nodeId,
          isSink: n.data.isSink && n.id !== nodeId,
        },
        style: {
          ...n.style,
          backgroundColor: n.id === nodeId ? '#90EE90' : (n.data.isSink ? '#FF6347' : '#ffffff'),
        },
      }))
    );
    setSourceNode(nodeId);
    closeContextMenus();
  }, [closeContextMenus, setNodes]);
  
  // Définir un nœud comme destination
  const setAsSink = useCallback((nodeId) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSink: n.id === nodeId,
          isSource: n.data.isSource && n.id !== nodeId,
        },
        style: {
          ...n.style,
          backgroundColor: n.id === nodeId ? '#FF6347' : (n.data.isSource ? '#90EE90' : '#ffffff'),
        },
      }))
    );
    setSinkNode(nodeId);
    closeContextMenus();
  }, [closeContextMenus, setNodes]);
  
  // Renommer un nœud
  const renameNode = useCallback((nodeId, newName) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              label: newName,
            },
          };
        }
        return n;
      })
    );
    closeContextMenus();
  }, [closeContextMenus, setNodes]);
  
  // Mettre à jour la capacité d'une arête
  const updateEdgeCapacity = useCallback((edgeId, capacity) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return {
            ...e,
            label: `0/${capacity}`,
            data: {
              ...e.data,
              capacity: parseInt(capacity, 10),
              flow: 0,
            },
          };
        }
        return e;
      })
    );
    closeContextMenus();
  }, [closeContextMenus, setEdges]);
  
  // Calcul du flot maximal
  const calculateMaxFlow = useCallback(() => {
    if (!sourceNode || !sinkNode) {
      alert('Veuillez définir un sommet source et un sommet destination.');
      return;
    }
    
    // Préparation des données pour l'algorithme
    const graph = {};
    nodes.forEach((node) => {
      graph[node.id] = {};
    });
    
    edges.forEach((edge) => {
      const { source, target, data } = edge;
      graph[source][target] = data.capacity;
    });
    
    // Exécution de l'algorithme de Ford-Fulkerson
    const { maxFlow, residualGraph } = fordFulkerson(graph, sourceNode, sinkNode);
    
    // Création du graphe avec les flots
    const flowEdges = edges.map((edge) => {
      const { source, target, data } = edge;
      const flow = residualGraph[source][target] ? 
                   data.capacity - residualGraph[source][target] : 
                   data.capacity;
      
      const isSaturated = flow >= data.capacity;
      const isBlocked = flow === 0;
      
      return {
        ...edge,
        label: `${flow}/${data.capacity}`,
        data: {
          ...data,
          flow,
          isSaturated,
          isBlocked,
        },
        animated: !isBlocked,
        style: {
          stroke: isSaturated ? '#FF0000' : (isBlocked ? '#CCCCCC' : '#008000'),
          strokeWidth: isSaturated ? 3 : 1,
        },
      };
    });
    
    setMaxFlowResult({ maxFlow, flowGraph: { nodes, edges: flowEdges } });
    setShowFlowGraph(true);
  }, [sourceNode, sinkNode, nodes, edges]);
  
  // Réinitialisation du graphe
  const resetGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
    setSourceNode(null);
    setSinkNode(null);
    setMaxFlowResult({ maxFlow: 0, flowGraph: null });
    setShowFlowGraph(false);
  }, [setNodes, setEdges]);
  
  // Basculer entre le graphe original et le graphe avec flot
  const toggleFlowGraph = useCallback(() => {
    setShowFlowGraph((prev) => !prev);
  }, []);
  
  // Activation de la manipulation des arêtes
  const activateEdgeManipulation = useCallback(() => {
    // Cette fonctionnalité nécessite une implémentation plus complexe
    alert('Fonctionnalité en cours de développement');
  }, []);
  
  // Afficher le graphe original
  const showOriginalGraph = useCallback(() => {
    setShowFlowGraph(false);
  }, []);
  
  return (
    <div className="app">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={showFlowGraph && maxFlowResult.flowGraph ? maxFlowResult.flowGraph.nodes : nodes}
          edges={showFlowGraph && maxFlowResult.flowGraph ? maxFlowResult.flowGraph.edges : edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={closeContextMenus}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <ControlPanel
              onAddNode={onAddNode}
              onCalculateMaxFlow={calculateMaxFlow}
              onResetGraph={resetGraph}
              onToggleFlowGraph={toggleFlowGraph}
              onActivateEdgeManipulation={activateEdgeManipulation}
              onShowOriginalGraph={showOriginalGraph}
              maxFlow={maxFlowResult.maxFlow}
              showFlowGraph={showFlowGraph}
            />
          </Panel>
        </ReactFlow>
      </div>
      
      {nodeMenu.visible && (
        <NodeContextMenu
          position={nodeMenu.position}
          node={nodeMenu.node}
          onSetAsSource={() => setAsSource(nodeMenu.node.id)}
          onSetAsSink={() => setAsSink(nodeMenu.node.id)}
          onRename={(newName) => renameNode(nodeMenu.node.id, newName)}
          onClose={closeContextMenus}
        />
      )}
      
      {edgeMenu.visible && (
        <EdgeContextMenu
          position={edgeMenu.position}
          edge={edgeMenu.edge}
          onUpdateCapacity={(capacity) => updateEdgeCapacity(edgeMenu.edge.id, capacity)}
          onClose={closeContextMenus}
        />
      )}
    </div>
  );
};

export default App;