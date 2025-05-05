// components/EdgeContextMenu.js
import React, { useState } from 'react';

const EdgeContextMenu = ({ position, edge, onUpdateCapacity, onClose }) => {
  const [capacity, setCapacity] = useState(edge.data.capacity);

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