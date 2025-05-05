// components/EdgeContextMenu.js
import React, { useState } from 'react';

const EdgeContextMenu = ({ position, edge, onUpdateCapacity, onClose }) => {
  // Vérification defensive pour s'assurer que edge et edge.data existent
  const currentCapacity = edge && edge.data ? edge.data.capacity : 0;
  const [capacity, setCapacity] = useState(currentCapacity);

  const handleSubmit = () => {
    onUpdateCapacity(capacity);
  };

  const style = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    zIndex: 10,
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: '10px',
  };

  // S'assurer que l'arête existe avant d'afficher le menu
  if (!edge) return null;

  return (
    <div style={style} onClick={(e) => e.stopPropagation()}>
      <div className="context-menu">
        <label>
          Capacité:
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            autoFocus
          />
        </label>
        <button onClick={handleSubmit}>Mettre à jour</button>
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
};

export default EdgeContextMenu;