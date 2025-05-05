// components/ControlPanel.js
import React from 'react';

const ControlPanel = ({
  onAddNode,
  onCalculateMaxFlow,
  onResetGraph,
  onToggleFlowGraph,
  onActivateEdgeManipulation,
  onShowOriginalGraph,
  maxFlow,
  showFlowGraph,
}) => {
  return (
    <div className="control-panel">
      <h3>Contrôles</h3>
      <button onClick={onAddNode}>Ajouter un nœud</button>
      <button onClick={onCalculateMaxFlow}>Calculer le flot maximal</button>
      <button onClick={onResetGraph}>Réinitialiser</button>
      <button onClick={onActivateEdgeManipulation}>Activer manipulation des arêtes</button>
      <button onClick={showFlowGraph ? onShowOriginalGraph : onToggleFlowGraph}>
        {showFlowGraph ? 'Voir graphe original' : 'Voir graphe de flot'}
      </button>
      {showFlowGraph && <div>Flot maximal : {maxFlow}</div>}
    </div>
  );
};

export default ControlPanel;