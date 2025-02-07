import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { catdb } from "../bdd/bdd.tsx";

// Structure & type la categorie
interface Category {
  id?: number; // Ajouté pour gérer l'ID généré par IndexedDB (AUTO_INCREMENT)
  name: string;
  desc: string;
}

export default function CategoryComponent() {
  // VARIABLE AVEC ETAT-----------------
  // Ajout
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");

// Visionner / Naviguer
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
//------------------------------------------


  // Charger les categories depuis IndexedDB ---
  const AfficheCategorie = async () => {
    const db = await catdb();
    const transaction = db.transaction(["categories"], "readonly");
    const categoryStore = transaction.objectStore("categories");
    const recupCategorie = categoryStore.getAll();

    recupCategorie.onsuccess = () => {
      if (recupCategorie.result) {
        setCategories(recupCategorie.result as Category[]);
      }
    };

    recupCategorie.onerror = () => {
      console.error("Probleme de chargement des Cat.");
    };
  };
 
  // Charger les categorie ---
  useEffect(() => {
    AfficheCategorie();
  }, []);

  // Gestion d'envoi ---
  const envoi = async (event: React.FormEvent) => {
    event.preventDefault();

    // Variables d'interactions
    const db = await catdb();
    const transaction = db.transaction(["categories"], "readwrite"); 
    const categorie = transaction.objectStore("categories");

    // Ajouter une categorie --- 
    const categoryRequest = categorie.add({ name: categoryName, desc: categoryDesc });
    await new Promise<void>((resolve, reject) => {
      categoryRequest.onsuccess = () => {
        console.log("Cat ajoutée");
        resolve();
      };
      categoryRequest.onerror = () => reject(categoryRequest.error);
    });

    // Recharger les categories après l'ajout
    AfficheCategorie();
    setCategoryName("");
    setCategoryDesc("");
  };

  // Navigation dans une categorie ---
  const CategorieClick = (categoryId: number) => {
    navigate(`/themes/${categoryId}`);
  };

  return (
    <div>
      <form onSubmit={envoi}>
        <h2>Ajouter une catégorie</h2>
        <input
          type="text"
          placeholder="Nom de la catégorie"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description de la catégorie"
          value={categoryDesc}
          onChange={(e) => setCategoryDesc(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>
      <div>
        <h2>Liste des catégories</h2>

        {/* Parcours l'objet categories (laisser id ? :/ ) */}
        {categories.map((category) => (
            <li key={category.id} onClick={() => CategorieClick(category.id!)}>
              {category.name} (ID: {category.id}) - {category.desc}
            </li>
          ))}

      </div>
    </div>
  );
}
