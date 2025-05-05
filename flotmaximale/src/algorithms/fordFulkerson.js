// algorithms/fordFulkerson.js

/**
 * Implémentation de l'algorithme de Ford-Fulkerson pour calculer le flot maximal
 * dans un graphe orienté.
 * 
 * @param {Object} graph - Un objet représentant le graphe où graph[u][v] est la capacité de l'arc (u,v)
 * @param {string} source - L'ID du nœud source
 * @param {string} sink - L'ID du nœud destination
 * @returns {Object} - Un objet contenant le flot maximal et le graphe résiduel
 */
export function fordFulkerson(graph, source, sink) {
  // Vérification des paramètres
  if (!graph || !source || !sink) {
    console.error("Paramètres invalides pour l'algorithme de Ford-Fulkerson");
    return { maxFlow: 0, residualGraph: {} };
  }
  
  // Vérifier que la source et le puits existent dans le graphe
  if (!graph[source]) {
    console.error("Le nœud source n'existe pas dans le graphe");
    return { maxFlow: 0, residualGraph: {} };
  }
  if (!graph[sink]) {
    console.error("Le nœud destination n'existe pas dans le graphe");
    return { maxFlow: 0, residualGraph: {} };
  }
  
  // Créer le graphe résiduel
  const residualGraph = {};
  
  // Initialiser le graphe résiduel avec les capacités du graphe original
  for (const u in graph) {
    residualGraph[u] = {};
    for (const v in graph[u]) {
      residualGraph[u][v] = graph[u][v];
      
      // S'assurer que les arcs inverses existent dans le graphe résiduel
      if (!residualGraph[v]) {
        residualGraph[v] = {};
      }
      if (!residualGraph[v][u]) {
        residualGraph[v][u] = 0;
      }
    }
  }
  
  let maxFlow = 0;
  
  // Rechercher un chemin augmentant dans le graphe résiduel
  while (true) {
    const { path, minCapacity } = findAugmentingPath(residualGraph, source, sink);
    
    // Si aucun chemin n'est trouvé, l'algorithme se termine
    if (!path) {
      break;
    }
    
    // Mettre à jour le flot maximum
    maxFlow += minCapacity;
    
    // Mettre à jour le graphe résiduel
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      
      residualGraph[u][v] -= minCapacity;
      residualGraph[v][u] += minCapacity;
    }
  }
  
  return { maxFlow, residualGraph };
}

/**
 * Recherche un chemin augmentant dans le graphe résiduel en utilisant BFS
 * 
 * @param {Object} residualGraph - Le graphe résiduel
 * @param {string} source - L'ID du nœud source
 * @param {string} sink - L'ID du nœud destination
 * @returns {Object} - Un objet contenant le chemin et la capacité minimale sur ce chemin
 */
function findAugmentingPath(residualGraph, source, sink) {
  // Vérification des paramètres
  if (!residualGraph || !source || !sink) {
    return { path: null, minCapacity: 0 };
  }
  
  // Vérifier que la source et le puits existent dans le graphe
  if (!residualGraph[source]) {
    return { path: null, minCapacity: 0 };
  }
  
  // Tableau pour stocker les nœuds à visiter
  const queue = [source];
  
  // Map pour stocker les nœuds précédents sur le chemin
  const parent = {};
  
  // Marquer tous les nœuds comme non visités
  const visited = { [source]: true };
  
  // BFS pour trouver un chemin de source à sink
  while (queue.length > 0) {
    const u = queue.shift();
    
    // Vérifier que le nœud existe dans le graphe résiduel
    if (!residualGraph[u]) continue;
    
    // Pour chaque voisin v de u dans le graphe résiduel
    for (const v in residualGraph[u]) {
      // Si v n'a pas été visité et qu'il y a de la capacité disponible
      if (!visited[v] && residualGraph[u][v] > 0) {
        queue.push(v);
        visited[v] = true;
        parent[v] = u;
        
        // Si nous avons atteint le sink, nous avons trouvé un chemin
        if (v === sink) {
          // Reconstruire le chemin
          const path = [sink];
          let current = sink;
          
          while (current !== source) {
            current = parent[current];
            path.unshift(current);
          }
          
          // Calculer la capacité minimale sur le chemin
          let minCapacity = Infinity;
          for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];
            minCapacity = Math.min(minCapacity, residualGraph[u][v]);
          }
          
          return { path, minCapacity };
        }
      }
    }
  }
  
  // Aucun chemin trouvé
  return { path: null, minCapacity: 0 };
}