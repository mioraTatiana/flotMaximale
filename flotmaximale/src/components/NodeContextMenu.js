// components/NodeContextMenu.js
import React, { useState } from 'react';

const NodeContextMenu = ({ position, node, onSetAsSource, onSetAsSink, onRename, onClose }) => {
  const [newName, setNewName] = useState(node.data.label);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = () => {
    if (isRenaming) {
      onRename(newName);
      setIsRenaming(false);
    } else {
      setIsRenaming(true);
    }
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
        <button onClick={onSetAsSource}>Définir comme source</button>
        <button onClick={onSetAsSink}>Définir comme destination</button>
        {isRenaming ? (
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button onClick={handleRename}>Confirmer</button>
          </div>
        ) : (
          <button onClick={handleRename}>Renommer</button>
        )}
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
};

export default NodeContextMenu;