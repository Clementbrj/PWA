import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catdb } from "../bdd/bdd.tsx";

interface Theme {
  id?: number;
  name: string;
  description: string;
  categoryId: number;
}

export default function ThemeComponent() {
  const [themeName, setThemeName] = useState("");
  const [themeDesc, setThemeDesc] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const { categoryId } = useParams<{ categoryId: string }>(); //----------------------- IMPORTE EN STRING A VOIR COMMENT L AVOIR EN NUMBER
  const navigate = useNavigate();

  // --------------------------------------------------------
  // TEST POUR REGLER CATEGORY EN NUMBER (marche pas pour l'instant)
  // Vérifiez que categoryId est un nombre valide
  console.error(categoryId);
  const validCategoryId = Number(categoryId);

  useEffect(() => {
    if (isNaN(validCategoryId)) {
      console.error("categoryId is not a valid number");
      console.error(validCategoryId);
      navigate("/"); // Rediriger vers la page d'accueil ou une page d'erreur
    } else {
      AfficheTheme();
    }
  }, [categoryId, navigate]);
  // --------------------------------------------------------


  // Afficher les thèmes
  const AfficheTheme = async () => {
    const db = await catdb();
    const transaction = db.transaction(["themes"], "readonly");
    const themeStore = transaction.objectStore("themes");
    const index = themeStore.index("categoryId");
    const request = index.getAll(validCategoryId); // Choppe les thèmes par rapport à l'id de la catégorie

    request.onsuccess = () => {
      if (request.result) {
        setThemes(request.result as Theme[]);
      }
    };

    request.onerror = () => {
      console.error("Erreur lors du chargement des thèmes");
    };
  };

  // Envoi du formulaire pour ajouter un theme
  const envoi = async (event: React.FormEvent) => {
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
        console.log("Thème ajouté avec succès !");
        resolve();
      };
      themeRequest.onerror = () => reject(themeRequest.error);
    });

    // Recharger les thèmes après l'ajout
    AfficheTheme();
    setThemeName("");
    setThemeDesc("");
  };

  return (
    <div>
      <div>
        <form onSubmit={envoi}>
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
        <ul>
          {themes.map((theme) => (
            <li key={theme.id}>
              {theme.name} - {theme.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
