import React from "react";
import { catdb } from "../bdd/catbdd.tsx";

// Définit la table Category
interface Category {
  name: string;
  desc: string;
}

async function loadCategoriesFromJSON() {
  try {
    //Lecture du JSON (ne PAS IMPORTER !!!! ça ne marchee pas..)
    const data = await fetch("src/bdd/store/catjson.json");

    if (!data.ok) {
      throw new Error(`Erreur lors de la récupération du fichier JSON : ${data.statusText}`);
    }

    const list: Category[] = await data.json();

    const db = await catdb();
    const transaction = db.transaction("categories", "readwrite");
    const store = transaction.objectStore("categories");

    // On s'assure que les données respectent le type `Category`
    list.forEach((category: Category) => {
      store.add(category);
    });

    alert("Catégories importées depuis JSON !");
  } catch{
    alert("PROBLEME DANS LEE TRY CATEGORIE");
  }
}


export default function Test() {
  return (
    <div>
      <h1>Chargement des catégories</h1>
      <button onClick={loadCategoriesFromJSON}>Charger les catégories</button>
    </div>
  );
}
