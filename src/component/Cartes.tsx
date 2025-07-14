import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { catdb } from "../bdd/bdd.tsx";
import "../css/cartes.css";

interface Card {
    id?: number;
    name: string;
    frontText?: string;
    frontMedia?: string;
    backText?: string;
    backMedia?: string;
    themeId?: number;
    level?: number;
    nextReview?: number;
}

export default function CartesComponent() {
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<number | "new">("new");
    const [cardName, setCardName] = useState("");
    const [frontText, setFrontText] = useState("");
    const [backText, setBackText] = useState("");
    const [frontMedia, setFrontMedia] = useState<File | null>(null);
    const [backMedia, setBackMedia] = useState<File | null>(null);
    const [visibleSide, setVisibleSide] = useState<{ [key: number]: "front" | "back" }>({});
    const navigate = useNavigate();

    // Récupérer le themeId depuis les paramètres d'URL
    const { themeId } = useParams<{ themeId: string }>();
    const themeIdValid = themeId ? parseInt(themeId, 10) : NaN;

    // Charger les cartes depuis IndexedDB en filtrant par themeId
    const AfficheCartes = async () => {
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readonly");
        const cardStore = transaction.objectStore("cards");

        if (!isNaN(themeIdValid)) {
            // Utiliser l'index "themeId" pour récupérer uniquement les cartes du thème courant
            const index = cardStore.index("themeId");
            const recupCartes = index.getAll(themeIdValid);
            recupCartes.onsuccess = () => {
                if (recupCartes.result) {
                    setCards(recupCartes.result as Card[]);
                }
            };
        } else {
            console.error("ThemeId invalide :", themeId);
            // Optionnel : rediriger ou afficher un message d'erreur
        }
    };

    useEffect(() => {
        if (isNaN(themeIdValid)) {
            console.error("ThemeId invalide :", themeId);
        } else {
            AfficheCartes();
        }

        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/service-worker.js")
                    .then(() => console.log("Service Worker enregistré avec succès"))
                    .catch((error) => console.error("Échec de l'enregistrement du Service Worker:", error));
            });
        }
    }, []);

    const askNotificationPermission = async () => {
        if (!("Notification" in window)) {
            console.warn("Les notifications ne sont pas supportées.");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Permission de notifications accordée.");
        } else {
            console.warn("Permission refusée.");
        }
    };

    const envoyerNotification = () => {
        if (Notification.permission === "granted") {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) {
                    reg.showNotification("Nouvelle carte ajoutée!", {
                        body: `La carte "${cardName}" a été ajoutée avec succès.`,
                        icon: "/icon.png",
                        badge: "/badge.png",
                    });
                }
            });
        }
    };

    useEffect(() => {
        if (selectedCardId === "new") {
            setCardName("");
            setFrontText("");
            setBackText("");
        } else {
            const card = cards.find((c) => c.id === selectedCardId);
            if (card) {
                setCardName(card.name);
                setFrontText(card.frontText || "");
                setBackText(card.backText || "");
            }
        }
    }, [selectedCardId, cards]);

    const envoi = async (event: React.FormEvent) => {
        event.preventDefault();
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readwrite");
        const cardStore = transaction.objectStore("cards");

        let frontMediaName = frontMedia ? frontMedia.name : "";
        let backMediaName = backMedia ? backMedia.name : "";

        if (selectedCardId === "new") {
            const newCard: Card = {
                name: cardName || `Carte ${cards.length + 1}`,
                frontText,
                frontMedia: frontMediaName,
                backText,
                backMedia: backMediaName,
                themeId: themeIdValid, // Association du thème à la carte
                level: 1,
                nextReview: Date.now(),
            };

            const addRequest = cardStore.add(newCard);
            addRequest.onsuccess = () => AfficheCartes();
        } else {
            const getRequest = cardStore.get(selectedCardId);
            getRequest.onsuccess = () => {
                const existingCard = getRequest.result as Card;
                if (!existingCard) return;

                existingCard.name = cardName;
                existingCard.frontText = frontText || existingCard.frontText;
                existingCard.frontMedia = frontMediaName || existingCard.frontMedia;
                existingCard.backText = backText || existingCard.backText;
                existingCard.backMedia = backMediaName || existingCard.backMedia;

                const updateRequest = cardStore.put(existingCard);
                updateRequest.onsuccess = () => AfficheCartes();
            };
        }

        // Réinitialisation des champs
        setFrontText("");
        setBackText("");
        setFrontMedia(null);
        setBackMedia(null);
    };

    const modifierNiveau = async (cardId: number, increment: number) => {
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readwrite");
        const cardStore = transaction.objectStore("cards");
        const getRequest = cardStore.get(cardId);

        getRequest.onsuccess = () => {
            const card = getRequest.result as Card;
            if (!card) return;

            if (increment > 0) {
                card.level = (card.level || 1) + increment;
                card.nextReview = Date.now()+ Math.pow(2, card.level) * 24 * 60 * 60 * 1000;
            } else {
                card.level = 1;
                card.nextReview = Date.now();
            }

            const updateRequest = cardStore.put(card);
            updateRequest.onsuccess = () => AfficheCartes();
        };
    };

    const Supprimer = async (cardId: number) => {
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readwrite");
        const cardStore = transaction.objectStore("cards");

        const deleteRequest = cardStore.delete(cardId);
        deleteRequest.onsuccess = () => {
            AfficheCartes();
        };
        deleteRequest.onerror = (event) => {
            console.error("Erreur lors de la suppression de la carte", event);
        };
    };

    const toggleSide = (cardId: number) => {
        setVisibleSide((prev) => ({
            ...prev,
            [cardId]: prev[cardId] === "back" ? "front" : "back",
        }));
    };

    const today = Date.now();
    const cardsToReview = cards.filter(card => (card.nextReview || 0) <= today);

    return (
        <div>
            <form onSubmit={envoi} className="form_cartes">
                <div className="container_info_form_cartes">
                    <h1 className="titre_form_cartes">Ajouter / Modifier une carte</h1>
                    <div className="liste_cartes">
                        <label className="label_cartes">Choisir une carte: </label>
                        <select className="select_cartes" value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value === "new" ? "new" : Number(e.target.value))}>
                            <option value="new">Créer une nouvelle carte</option>
                            {cards.map((card) => (
                                <option key={card.id} value={card.id}>
                                    {card.name} (ID: {card.id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="detail_cartes">
                        <div className="container_form_nom_cartes">
                            <label className="label_cartes">Nom de la carte :</label>
                            <input type="text" className="input_cartes" placeholder="Nom de la carte" value={cardName} onChange={(e) => setCardName(e.target.value)} required />
                        </div>
                        <div className="container_form_desktop">
                            <div className="container_form_recto">
                                <label className="label_cartes">Recto :</label>
                                <input type="text" className="input_cartes" placeholder="Texte du recto" value={frontText} onChange={(e) => setFrontText(e.target.value)} required />
                                <input type="file" className="import_media" accept="image/*,audio/*,video/*" onChange={(e) => setFrontMedia(e.target.files?.[0] || null)}  />
                            </div>
                            <div className="container_form_verso">
                                <label className="label_cartes">Verso :</label>
                                <input type="text" className="input_cartes" placeholder="Texte du verso" value={backText} onChange={(e) => setBackText(e.target.value)} required/>
                                <input type="file" className="import_media" accept="image/*,audio/*,video/*" onChange={(e) => setBackMedia(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                    </div>
                    <div className="container_bouton_valider">
                        <button type="submit" className="bouton_valider_cartes">Valider</button>
                    </div>
                </div>
            </form>

            <div className="container_cartes">
                <h2 className="titre_liste_cartes">Cartes à réviser</h2>
                <div className="config_notifs">
                    <h2>Voulez vous activer les notifications lorsque une nouvelle carte est disponible?</h2>
                    <form onSubmit={envoi}>
                        <input type="radio"  value="Oui"/>
                        <label htmlFor="html">Oui</label>
                        <input type="radio" value="Non"/>
                        <label htmlFor="html">NON</label>
                    </form>
                </div>
                {cardsToReview.map((card) => (
                    <div key={card.id} className="container_liste_cartes">
                        <h3 className="titre_cartes">{card.name} - Niveau : {card.level}</h3>
                        {visibleSide[card.id!] !== "back" ? (
                            <div>
                                <p>{card.frontText}</p>
                                {card.frontMedia && <p>📂 {card.frontMedia}</p>}
                            </div>
                        ) : (
                            <div>
                                <p>{card.backText}</p>
                                {card.backMedia && <p>📂 {card.backMedia}</p>}
                                <div className="container_bouton_choix">
                                    <button className="bouton_choix1" onClick={() => modifierNiveau(card.id!, 1)}>✔️ Réussi</button>
                                    <button className="bouton_choix2" onClick={() => modifierNiveau(card.id!, 0)}>❌ Raté</button>
                                </div>
                            </div>
                        )}
                        <button className="bouton_change_side" onClick={() => toggleSide(card.id!)}>Voir {visibleSide[card.id!] === "back" ? "le recto" : "le verso"}</button>
                        <div className="container_bouton_suppression_cartes">
                            <button className="suppression_cartes" onClick={() => Supprimer(card.id!)}>Supprimer la carte</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
