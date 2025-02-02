export async function catdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // Ouvrir la base de données
      const request = indexedDB.open("ProjetMemo", 1);
  
      // Gère l'existence de la table dans la DB côté client
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest).result as IDBDatabase;
  
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
        }
      };
  
      // Gestion du retour de la fonction
      request.onsuccess = () => resolve(request.result as IDBDatabase);
      request.onerror = () => reject(request.error);
    });
  }