
// Fonction pour créer la structure dans l'IndexDb
export async function catdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const CreateDB = indexedDB.open("ProjetMemo", 1); // Nom de la BDD

    CreateDB.onupgradeneeded = (event: IDBVersionChangeEvent) => { // Créer la BDD
      const db = (event.target as IDBRequest).result as IDBDatabase; // Accède à l'indexDB 

      // Créer catégories
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
      }

      // Créer thèmes
      if (!db.objectStoreNames.contains("themes")) {
<<<<<<< HEAD
        const themeStore = db.createObjectStore("themes", { keyPath: "id", autoIncrement: true });
        themeStore.createIndex("categoryId", "categoryId", { unique: false }); // Crée un index sur categoryId
=======
        db.createObjectStore("themes", { keyPath: "id", autoIncrement: true });
>>>>>>> origin/branche_ethan
      }

      // Créer cartes
      if (!db.objectStoreNames.contains("cards")) {
        db.createObjectStore("cards", { keyPath: "id", autoIncrement: true });
      }
    };
    // Gestion du résultat
    CreateDB.onsuccess = () => resolve(CreateDB.result as IDBDatabase);
    CreateDB.onerror = () => reject(CreateDB.error);
  });
}
