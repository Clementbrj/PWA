import { catdb } from "../bdd/bdd.tsx";

interface Card {
    title: string;
    face: string;
    verso: string;
    themeId: string;
    level: number;
}

interface Theme {
    name: string;
    description: string;
    CategoryId: string;
    cards: Card[];
}

interface Category {
    name: string;
    desc: string;
    themes: Theme[];
}

const generateData = async () => {
    // Préparer les catégories
    const categoriesData = Array.from({ length: 3 }, (_, categoryIndex) => ({
        name: `Simulation ${categoryIndex + 1}`,
        desc: `Desc simulation ${categoryIndex + 1}`,
        themes: Array.from({ length: 2 }, (_, themeIndex) => {
            const categoryId = `catref-${categoryIndex + 1}`;
            const themeId = `theme-${categoryIndex + 1}-${themeIndex + 1}`;
            return {
                name: `Thème ${themeIndex + 1} de ${categoryId}`,
                description: `Description simulation ${themeIndex + 1}`,
                CategoryId: categoryId,
                cards: Array.from({ length: 5 }, () => ({
                    // Gestion en dessous
                }))
            };
        })
    }));

    // Charger IndexedDB
    const db = await catdb();
    const transaction = db.transaction(["categories", "themes", "cards"], "readwrite");

    // Object stores
    const categoryStore = transaction.objectStore("categories");
    const themeStore = transaction.objectStore("themes");
    const cardStore = transaction.objectStore("cards");

    // Ajouter les catégories
    categoriesData.forEach((category) => {
        const categoryRequest = categoryStore.add({
            name: category.name,
            desc: category.desc
        });

        categoryRequest.onsuccess = () => {
            const categoryId = categoryRequest.result;

            // Ajouter les thèmes
            category.themes.forEach((theme) => {
                const themeRequest = themeStore.add({
                    name: theme.name,
                    description: theme.description,
                    categoryId: categoryId
                });

                themeRequest.onsuccess = () => {
                    const themeId = themeRequest.result;

                    // Ajouter les cartes
                    let i=0;
                    theme.cards.forEach(() => {
                        if(i<4){
                        const cardRequest = cardStore.add({
                            name: `Carte${i+1}`,
                            frontText:"Recto",
                            frontMedia: "x",
                            backText:"Verso",
                            backMedia: "x",
                            themeId: themeId,
                            level: 1,
                            nextReview: Date.now(),
                        });
                        // Gestion d'erreurs
                        cardRequest.onerror = (event) => {
                            console.error("Erreur lors de l'ajout d'une carte :", event);
                        };
                        
                        } else{
                            // Oui, plaisir 100% pro.
                            const cardRequest = cardStore.add({
                                name: `Carte${i}`,
                                frontText:"Recto",
                                frontMedia: "/src/component/secret.gif",
                                backText:"MIAOUU",
                                backMedia: "/src/component/hf.mp3",
                                themeId: themeId,
                                level: 1,
                                nextReview: Date.now(),
                            });
                                                    // Gestion d'erreurs
                        cardRequest.onerror = (event) => {
                            console.error("Erreur lors de l'ajout d'une carte :", event);
                        };
                        }
                        // Gestion d'erreurs
                        i++;
                    });
                };

                themeRequest.onerror = (event) => {
                    console.error("Erreur lors de l'ajout d'un thème :", event);
                };
            });
        };

        categoryRequest.onerror = (event) => {
            console.error("Erreur lors de l'ajout d'une catégorie :", event);
        };
    });


    transaction.oncomplete = () => {
        console.log("Success");
    };

    transaction.onerror = (event) => {
        console.error("Error :", event);
    };
};

export default generateData;
