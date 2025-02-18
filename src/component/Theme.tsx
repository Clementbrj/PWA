import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catdb } from "../bdd/bdd.tsx";
import "../css/Theme.css";

// Structure des obj JSON
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
export default function ThemeComponent() {
  const [themeName, setThemeName] = useState("");
  const [themeDesc, setThemeDesc] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [editThemeId, setEditThemeId] = useState<number | null>(null);
  const [editThemeName, setEditThemeName] = useState("");
  const [editThemeDesc, setEditThemeDesc] = useState("");
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  // Cast le pathparam en int
  const validCategoryId = categoryId ? parseInt(categoryId, 10) : NaN;

  // S'adapte à l'état de la variable CategoryID
  useEffect(() => {
    if (isNaN(validCategoryId)) {
      console.error("categoryId is not a valid number");
      console.error(validCategoryId);

    } else {
      ShowTheme();
    }
  }, [categoryId, navigate]);

  //------------------------------------------
  // INDEX DB
  //------------------------------------------
  // Afficher les thèmes
  const ShowTheme = async () => {
    const db = await catdb();
    const transaction = db.transaction(["themes"], "readonly");
    const themeStore = transaction.objectStore("themes");
    const index = themeStore.index("categoryId");
    const request = index.getAll(validCategoryId); // Choppe les thèmes par rapport à l'id de la catégorie

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        setThemes(request.result as Theme[]);
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors du chargement des Thèmes. #ShowTheme - " + request.error?.message);
        reject();
      };
    });
  };

  //-----------------------------------------------------
  // Envoi du formulaire pour ajouter un theme
  const envoi = async (event: React.FormEvent) => {
    if (themeName === "") {
      alert("Il faut renseigner un nom du Theme !");
    }

    console.log(themes);
    event.preventDefault();

    const db = await catdb();
    const transaction = db.transaction(["themes"], "readwrite");
    const themeStore = transaction.objectStore("themes");

    const themeRequest = themeStore.add({
      name: themeName,
      description: themeDesc,
      categoryId: validCategoryId,
    });

    await new Promise<void>((resolve, reject) => {
      themeRequest.onsuccess = () => {
        resolve();
      };
      themeRequest.onerror = () => {
        alert("Erreur lors de l'ajout. #envoi - " + themeRequest.error);
        reject();
      };
    });

    // Recharger les thèmes après l'ajout
    ShowTheme();
    setThemeName("");
    setThemeDesc("");
  };

  // -----------------------------------------------------
  // Supprimer un thème
  const DelecardByTheme = async (themeId: number) => {
    const db = await catdb();
    const transaction = db.transaction(["cards"], "readwrite");
    const cardStore = transaction.objectStore("cards");
    const index = cardStore.index("themeId");
    const request = index.getAll(themeId);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const CardArray = request.result as Card[];
        CardArray.forEach((Card) => {
          if (Card.id) {
            cardStore.delete(Card.id);
          }
        });
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors de la suppression des cartes dans le thème. #DelecardByTheme - " + request.error?.message);
        reject();
      };
    });
  };

  const DeleteTheme = async (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>, themeId: number) => {
    event.preventDefault();
    await DelecardByTheme(themeId);

    const db = await catdb();
    const transaction = db.transaction(["themes"], "readwrite");
    const themeStore = transaction.objectStore("themes");
    const request = themeStore.delete(themeId);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        alert("Erreur lors de la suppression du Thème. #DeleteTheme - " + request.error?.message);
        reject();
      };
    });

    ShowTheme();
  };

  // -----------------------------------------------------
  // Éditer un thème
  const EditTheme = async (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>, themeId: number) => {
    event.preventDefault();
    setEditThemeId(themeId);

    const db = await catdb();
    const transaction = db.transaction(["themes"], "readwrite");
    const themeStore = transaction.objectStore("themes");

    // Récupérer le thème à éditer
    const getEditTheme = themeStore.get(themeId);

    await new Promise<void>((resolve, reject) => {
      // Promesse OUI pour GET
      getEditTheme.onsuccess = () => {
        if (getEditTheme.result) {
          const theme = getEditTheme.result;
          setEditThemeName(theme.name);
          setEditThemeDesc(theme.description);
          resolve();
        } else {
          alert("Erreur lors de la récupération du thème #EditTheme - " + getEditTheme.error?.message);
          reject();
        }
      };
      // Promesse NON pour GET
      getEditTheme.onerror = () => {
        alert("Thème non trouvé #EditTheme - " + getEditTheme.error);
        reject();
      };
    });
  };

  const SaveEditTheme = async (event: React.FormEvent, themeId: number) => {
    event.preventDefault();

    const db = await catdb();
    const transaction = db.transaction(["themes"], "readwrite");
    const themeStore = transaction.objectStore("themes");

    const getEditTheme = themeStore.get(themeId);

    await new Promise<void>((resolve, reject) => {
      getEditTheme.onsuccess = () => {
        if (getEditTheme.result) {
          const theme = getEditTheme.result;
          theme.name = editThemeName;
          theme.description = editThemeDesc;

          const updateRequest = themeStore.put(theme);

          updateRequest.onsuccess = () => {
            console.log("Thème mis à jour avec succès !");
            setEditThemeId(null);
            setEditThemeName("");
            setEditThemeDesc("");
            ShowTheme();
            resolve();
          };

          updateRequest.onerror = () => {
            alert("Erreur lors de la MAJ du thème #SaveEditTheme - " + updateRequest.error?.message);
            reject();
          };
        } else {
          alert("Erreur lors de la récupération du thème #SaveEditTheme - " + getEditTheme.error?.message);
          reject();
        }
      };
      getEditTheme.onerror = () => {
        alert("Thème non trouvé #SaveEditTheme - " + getEditTheme.error);
        reject();
      };
    });
  };

  //------------------------------------------
  // 
  //------------------------------------------

  // Navigation dans une catégorie
  const ThemeClick = (themeId: number) => {
    navigate(`/cartes/${themeId}`);
  };

  // Retour en arrière
  const NavBack = () => {
    navigate(-1);
  };

  return (
    <div className="background">
      <div className="ReturnContainer">
        <p onClick={NavBack} className="ReturnArrow">
          Retour en Arrière ←
        </p>
      </div>
      <div>
        <form onSubmit={envoi} className="FormContent">
          <h2>Ajouter un thème</h2>
          <input
            type="text"
            placeholder="Nom du thème"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description du thème"
            value={themeDesc}
            onChange={(e) => setThemeDesc(e.target.value)}
          />
          <button type="submit">Ajouter</button>
        </form>
      </div>
      <div>
        <h2>Thèmes de la catégorie</h2>
        <ul className="ThemeList">
          {themes.map((theme) => (
            <li key={theme.id} className="ThemeItem">
              {editThemeId === theme.id ? (
                <form onSubmit={(e) => SaveEditTheme(e, theme.id!)} className="editForm">
                  <input
                    type="text"
                    placeholder="Nom du thème"
                    value={editThemeName}
                    onChange={(e) => setEditThemeName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Description du thème"
                    value={editThemeDesc}
                    onChange={(e) => setEditThemeDesc(e.target.value)}
                  />
                  <button type="submit">Enregistrer</button>
                </form>
              ) : (
                <div onClick={() => ThemeClick(theme.id!)}>
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                </div>
              )}
              <p className="ThemeInteract" onClick={(event) => DeleteTheme(event, theme.id!)}>❌</p>
              <p className="ThemeInteract" onClick={(event) => EditTheme(event, theme.id!)}>✏️</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
