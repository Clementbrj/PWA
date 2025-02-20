import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { catdb } from "../bdd/bdd.tsx";
import "../css/Cat.css";

// Déclarer les structures de Categories ET de Theme
interface Category {
  id?: number;
  name: string;
  desc: string;
}

interface Theme {
  id?: number;
  name: string;
  description: string;
  categoryId: number;
}

interface Card {
  id?: number;
  name: string;
  frontText?: string;
  frontMedia?: string;
  backText?: string;
  backMedia?: string;
  themeId?: number;
  level?: number;
}

// --------------
// Composant
export default function CategoryComponent() {
  const [categoryName, setCategoryName] = useState(""); // CatName pour le form
  const [categoryDesc, setCategoryDesc] = useState(""); // CatDesc pour le form
  const [CategorieArray, setCategorieArray] = useState<Category[]>([]); // Stocker la liste des catégories
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDesc, setEditCategoryDesc] = useState("");
  const navigate = useNavigate(); // Navigation dans la PWA

  //------------------------------------------
  // INDEX DB
  //------------------------------------------

  // Charger les categories depuis IndexedDB
  const ShowCategorie = async () => {
    const db = await catdb();
    const transaction = db.transaction(["categories"], "readonly");
    const categoryStore = transaction.objectStore("categories");
    const recupCategorie = categoryStore.getAll();

    await new Promise<void>((resolve, reject) => {
      recupCategorie.onsuccess = () => {
        setCategorieArray(recupCategorie.result as Category[]);
        resolve();
      };
      recupCategorie.onerror = () => {
        alert("Problème de chargement des Cat. #ShowCategorie - " + recupCategorie.error?.message);
        reject();
      };
    });
  };

  //-----------------------------------------------------
  // Gestion d'envoi pour une nouvelle catégorie
  const envoi = async (event: React.FormEvent) => {
    if (categoryName === "") {
      alert("Il faut renseigner un nom de catégorie !");
    } else {
      event.preventDefault();

      // Variables d'interactions
      const db = await catdb();
      const transaction = db.transaction(["categories"], "readwrite");
      const categorie = transaction.objectStore("categories");

      // Ajouter une categorie ---
      const categoryRequest = categorie.add({ name: categoryName, desc: categoryDesc });
      await new Promise<void>((resolve, reject) => {
        categoryRequest.onsuccess = () => {
          resolve();
        };
        categoryRequest.onerror = () => {
          alert("Erreur lors de l'ajout. #envoi - " + categoryRequest.error?.message);
          reject();
        };
      });

      // Recharger les categories après l'ajout
      ShowCategorie();
      setCategoryName("");
      setCategoryDesc("");
    }
  };

  // -----------------------------------------------------
  // Supprimer une une carte -> theme -> categorie
  const deleteCardByTheme = async (ThemeId: number) => {
    const db = await catdb();
    const transaction = db.transaction(["cards"], "readwrite");
    const themeStore = transaction.objectStore("cards");
    const index = themeStore.index("themeId");
    const request = index.getAll(ThemeId);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const CardArray = request.result as Card[];
        CardArray.forEach((card) => {
          if (card.id) {
            themeStore.delete(card.id);
          }
        });
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors de la suppression des cartes dans le theme. #deleteCardByTheme - " + request.error?.message);
        reject();
      };
    });
  };

  const deleteThemeByCat = async (categoryId: number) => {
    const db = await catdb();

    await deleteCardByTheme(categoryId);

    const transaction = db.transaction(["themes"], "readwrite");
    const themeStore = transaction.objectStore("themes");
    const index = themeStore.index("categoryId");
    const request = index.getAll(categoryId);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const ThemeArray = request.result as Theme[];
        ThemeArray.forEach((theme) => {
          if (theme.id) {
            themeStore.delete(theme.id);
          }
        });
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors de la suppression des thèmes dans la catégorie. #deleteThemeByCat - " + request.error?.message);
        reject();
      };
    });
  };

  const DeleteCategory = async (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>, categoryId: number) => {
    event.preventDefault();
    await deleteThemeByCat(categoryId);

    const db = await catdb();
    const transaction = db.transaction(["categories"], "readwrite");
    const categoryStore = transaction.objectStore("categories");
    const request = categoryStore.delete(categoryId);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors de la suppression de la catégorie. #DeleteCategory - " + request.error?.message);
        reject();
      };
    });

    ShowCategorie();
  };

  // -----------------------------------------------------
  // Éditer une catégorie
  const EditCategory = async (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>, categoryId: number) => {
    event.preventDefault();
    setEditCategoryId(categoryId);

    const db = await catdb();
    const transaction = db.transaction(["categories"], "readwrite");
    const categoryStore = transaction.objectStore("categories");

    // Récupérer la catégorie à éditer
    const getEditCat = categoryStore.get(categoryId);

    await new Promise<void>((resolve, reject) => {
      // Promesse OUI pour GET
      getEditCat.onsuccess = () => {
        if (getEditCat.result) {
          const category = getEditCat.result;
          setEditCategoryName(category.name);
          setEditCategoryDesc(category.desc);
          resolve();
        } else {
          alert("Erreur lors de la récupération de la catégorie #EditCategory - " + getEditCat.error?.message);
          reject();
        }
      };
      // Promesse NON pour GET
      getEditCat.onerror = () => {
        alert("Catégorie non trouvée #EditCategory - " + getEditCat.error);
        reject();
      };
    });
  };

  const SaveEditCategory = async (event: React.FormEvent, categoryId: number) => {
    event.preventDefault();

    const db = await catdb();
    const transaction = db.transaction(["categories"], "readwrite");
    const categoryStore = transaction.objectStore("categories");

    const getEditCat = categoryStore.get(categoryId);

    await new Promise<void>((resolve, reject) => {
      getEditCat.onsuccess = () => {
        if (getEditCat.result) {
          const category = getEditCat.result;
          category.name = editCategoryName;
          category.desc = editCategoryDesc;

          const updateRequest = categoryStore.put(category);

          updateRequest.onsuccess = () => {
            console.log("Catégorie mise à jour avec succès !");
            setEditCategoryId(null);
            setEditCategoryName("");
            setEditCategoryDesc("");
            ShowCategorie();
            resolve();
          };

          updateRequest.onerror = () => {
            alert("Erreur lors de la MAJ de la catégorie #SaveEditCategory - " + updateRequest.error?.message);
            reject();
          };
        } else {
          alert("Erreur lors de la récupération de la catégorie #SaveEditCategory - " + getEditCat.error?.message);
          reject();
        }
      };
      getEditCat.onerror = () => {
        alert("Catégorie non trouvée #SaveEditCategory - " + getEditCat.error);
        reject();
      };
    });
  };

  //------------------------------------------
  // Charger les catégories au montage du composant
  useEffect(() => {
    ShowCategorie();
  }, []);

  // Navigation dans une catégorie
  const CategorieClick = (categoryId: number) => {
    navigate(`/themes/${categoryId}`);
  };

  return (
    <div className="background">
      <form onSubmit={envoi} className="FormContent">
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
        <h2>Liste de vos catégories</h2>
        <ul className="categoryList">
          {CategorieArray.map((category) => (
            <li key={category.id} className="categoryItem">
              {/* Vérifie si l'id de la cat à modifier = l'id de la cat en cours d'affichage pour mettre les inputs */}
              {editCategoryId === category.id ? (
                <form onSubmit={(e) => SaveEditCategory(e, category.id!)} className="editForm">
                  <input
                    type="text"
                    placeholder="Nom de la catégorie"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Description de la catégorie"
                    value={editCategoryDesc}
                    onChange={(e) => setEditCategoryDesc(e.target.value)}
                  />
                  <button type="submit">Enregistrer</button>
                </form>
              ) : (
                <div onClick={() => CategorieClick(category.id!)}>
                  <h3>{category.name}</h3>
                  <p>{category.desc}</p>
                </div>
              )}
              <div className="ReturnContainer">
              <p className="CategoryInteract" onClick={(event) => DeleteCategory(event, category.id!)}>❌</p>
              <p className="CategoryInteract" onClick={(event) => EditCategory(event, category.id!)}>✏️</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
