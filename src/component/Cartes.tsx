import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catdb } from "../bdd/bdd.tsx";
import "../css/Cartes.css";
import {Workbox} from "workbox-window";


interface Card {
    id?: number;
    name: string;
    frontText?: string;
    frontMedia?: string;
    backText?: string;
    backMedia?: string;
    themeId?: number; // Ajout de la gestion du thème
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
    const [notification, setNotification] = useState<string | null>(null);
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
        if (!isNaN(themeIdValid)) {
            AfficheCartes();
        }

        if ("serviceWorker" in navigator) {
            console.log("Service Worker");
            window.addEventListener("load", () => {
                const wb = new Workbox("/sw.js");
                wb.register()
                    .then(() => {
                        console.log("Service Worker enregistré avec succès");
                    })
                    .catch((error) => {
                        console.error("Échec de l'enregistrement du Service Worker:", error);
                    });
            });
        }
    }, [themeId]);

// 🔔 Vérifier les cartes à réviser dès le chargement
    useEffect(() => {
        if (cards.length > 0) {
            envoyerNotificationCartes();
        }
    }, [cards]); // Exécute la fonction après le chargement des cartes

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

        let frontMediaUrl = frontMedia ? URL.createObjectURL(frontMedia) : "";
        let backMediaUrl = backMedia ? URL.createObjectURL(backMedia) : "";

        if (selectedCardId === "new") {
            const newCard: Card = {
                name: cardName || `Carte ${cards.length + 1}`,
                frontText,
                frontMedia: frontMediaUrl,
                backText,
                backMedia: backMediaUrl,
                themeId: themeIdValid,
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
                existingCard.frontMedia = frontMediaUrl || existingCard.frontMedia;
                existingCard.backText = backText || existingCard.backText;
                existingCard.backMedia = backMediaUrl || existingCard.backMedia;

                const updateRequest = cardStore.put(existingCard);
                updateRequest.onsuccess = () => AfficheCartes();
            };
        }

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
                card.nextReview = Date.now() + Math.pow(2, card.level - 1) * 2;
            } else {
                card.level = 1;
                card.nextReview = Date.now();
            }

            const updateRequest = cardStore.put(card);
            updateRequest.onsuccess = () => {
                AfficheCartes();

                // 🔔 Vérifier si la carte doit être révisée et envoyer une notification
                setTimeout(() => {
                    if ((card.nextReview || 0) <= Date.now()) {
                        envoyerNotificationCartes();
                    }
                }, 500); // Petit délai pour assurer que la mise à jour est prise en compte
            };
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
    const renderMedia = (mediaUrl: string | undefined) => {
        if (!mediaUrl) return null;

        // Vérifier si c'est une URL blob
        console.log("Affichage du média :", mediaUrl);

        const extension = mediaUrl.split('.').pop()?.toLowerCase();

        if (mediaUrl.startsWith("blob:") || extension?.match(/(jpg|jpeg|png|gif|webp)/)) {
            return <img src={mediaUrl} alt="Image" className="media-preview" />;
        }
        if (extension?.match(/(mp3|wav|ogg)/)) {
            return <audio controls><source src={mediaUrl} type={`audio/${extension}`} />Votre navigateur ne supporte pas l'audio.</audio>;
        }
        if (extension?.match(/(mp4|webm|ogg)/)) {
            return <video controls><source src={mediaUrl} type={`video/${extension}`} />Votre navigateur ne supporte pas la vidéo.</video>;
        }

        return <p>📂 Fichier non reconnu</p>;
    };

    useEffect(() => {
        return () => {
            if (frontMedia) URL.revokeObjectURL(frontMedia as unknown as string);
            if (backMedia) URL.revokeObjectURL(backMedia as unknown as string);
        };
    }, [frontMedia, backMedia]);

    const demanderPermissionNotification = async () => {
        if (!("Notification" in window)) {
            console.error("Les notifications ne sont pas supportées par ce navigateur.");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Permission de notification accordée.");
        } else {
            console.warn("Permission de notification refusée.");
        }
    };

    useEffect(() => {
        demanderPermissionNotification();
    }, []);
    const envoyerNotificationCartes = () => {
        const aujourdHui = Date.now();
        const cartesAReviser = cards.filter(card => (card.nextReview || 0) < aujourdHui);

        if (cartesAReviser.length > 0) {
            const message = `📚 Tu as ${cartesAReviser.length} carte(s) à réviser aujourd'hui.`;
            setNotification(message); // 🔔 Afficher la notification sur la page

            // ⏳ Cacher la notification après 5 secondes
            setNotification(message);

        }
    };


    useEffect(() => {
        const interval = setInterval(() => {
            envoyerNotificationCartes();
        }, 60 * 60 * 1000); // Vérification toutes les heures

        return () => clearInterval(interval);
    }, [cards]);

    useEffect(() => {
        return () => {
            if (frontMedia) URL.revokeObjectURL(frontMedia as unknown as string);
            if (backMedia) URL.revokeObjectURL(backMedia as unknown as string);
        };
    }, [frontMedia, backMedia]);

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
            {notification && (
                <div className="notification-banner2">
                    {notification}
                </div>
            )}
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
                            <input type="text" className="input_cartes" placeholder="Nom de la carte" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                        </div>
                        <div className="container_form_desktop">
                            <div className="container_form_recto">
                                <label className="label_cartes">Recto :</label>
                                <input type="text" className="input_cartes" placeholder="Texte du recto" value={frontText} onChange={(e) => setFrontText(e.target.value)} />
                                <input type="file" className="import_media" accept="image/*,audio/*,video/*" onChange={(e) => setFrontMedia(e.target.files?.[0] || null)} />
                            </div>
                            <div className="container_form_verso">
                                <label className="label_cartes">Verso :</label>
                                <input type="text" className="input_cartes" placeholder="Texte du verso" value={backText} onChange={(e) => setBackText(e.target.value)} />
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
                {notification && <p>{notification}</p>}
                {cardsToReview.map((card) => (
                    <div key={card.id} className="container_liste_cartes">
                        <h3 className="titre_cartes">{card.name} - Niveau : {card.level}</h3>
                        {visibleSide[card.id!] !== "back" ? (
                            <div>
                                <p>{card.frontText}</p>
                                {renderMedia(card.frontMedia)}
                            </div>
                        ) : (
                            <div>
                                <p>{card.backText}</p>
                                {renderMedia(card.backMedia)}
                                <div className="container_bouton_choix">
                                    <button className="bouton_choix1" onClick={() => modifierNiveau(card.id!, 1)}>✔️ Réussi</button>
                                    <button className="bouton_choix2" onClick={() => {
                                        modifierNiveau(card.id!, 0);
                                        setVisibleSide(prev => ({ ...prev, [card.id!]: "front" }));
                                    }}>❌ Raté</button>
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
