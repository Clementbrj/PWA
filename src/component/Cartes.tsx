import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { catdb } from "../bdd/bdd.tsx";

interface Card {
    id?: number;
    name: string;
    frontText?: string;
    frontMedia?: string;
    backText?: string;
    backMedia?: string;
    level?: number; // Nouveau champ pour le niveau
}

export default function CartesComponent() {
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<number | "new">("new");
    const [cardName, setCardName] = useState("");
    const [visibleSide, setVisibleSide] = useState<{ [key: number]: "front" | "back" }>({});
    const [face, setFace] = useState<"front" | "back">("front");
    const [text, setText] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const navigate = useNavigate();

    // Charger les cartes depuis IndexedDB
    const AfficheCartes = async () => {
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readonly");
        const cardStore = transaction.objectStore("cards");
        const recupCartes = cardStore.getAll();

        recupCartes.onsuccess = () => {
            if (recupCartes.result) {
                setCards(recupCartes.result as Card[]);
            }
        };
    };

    useEffect(() => {
        AfficheCartes();
    }, []);

    // Gérer la sélection d'une carte
    useEffect(() => {
        if (selectedCardId === "new") {
            setCardName("");
            setText("");
        } else {
            const card = cards.find((c) => c.id === selectedCardId);
            if (card) {
                setCardName(card.name);
                setText(face === "front" ? card.frontText || "" : card.backText || "");
            }
        }
    }, [selectedCardId, face, cards]);

    // Gestion de l'envoi
    const envoi = async (event: React.FormEvent) => {
        event.preventDefault();
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readwrite");
        const cardStore = transaction.objectStore("cards");

        let mediaFileName = "";
        if (mediaFile) {
            mediaFileName = mediaFile.name;
        }

        if (selectedCardId === "new") {
            const newCard: Card = {
                name: cardName || `Carte ${cards.length + 1}`,
                frontText: face === "front" ? text : "",
                frontMedia: face === "front" ? mediaFileName : "",
                backText: face === "back" ? text : "",
                backMedia: face === "back" ? mediaFileName : "",
                level: 0, // Niveau initial à 0
            };

            const addRequest = cardStore.add(newCard);
            addRequest.onsuccess = () => AfficheCartes();
        } else {
            const getRequest = cardStore.get(selectedCardId);
            getRequest.onsuccess = () => {
                const existingCard = getRequest.result as Card;

                existingCard.name = cardName;

                if (face === "front") {
                    existingCard.frontText = text || existingCard.frontText;
                    existingCard.frontMedia = mediaFileName || existingCard.frontMedia;
                } else {
                    existingCard.backText = text || existingCard.backText;
                    existingCard.backMedia = mediaFileName || existingCard.backMedia;
                }

                const updateRequest = cardStore.put(existingCard);
                updateRequest.onsuccess = () => AfficheCartes();
            };
        }

        setText("");
        setMediaFile(null);
    };

    // Modifier le niveau d'une carte
    const modifierNiveau = async (cardId: number, delta: number) => {
        const db = await catdb();
        const transaction = db.transaction(["cards"], "readwrite");
        const cardStore = transaction.objectStore("cards");

        const getRequest = cardStore.get(cardId);
        getRequest.onsuccess = () => {
            const card = getRequest.result as Card;
            if (card) {
                card.level = Math.max(0, Math.min(10, (card.level || 0) + delta)); // Niveau entre 0 et 10
                const updateRequest = cardStore.put(card);
                updateRequest.onsuccess = () => AfficheCartes();
            }
        };
    };

    // Basculer entre recto et verso
    const toggleSide = (cardId: number) => {
        setVisibleSide((prev) => ({
            ...prev,
            [cardId]: prev[cardId] === "front" ? "back" : "front",
        }));
    };

    return (
        <div>
            <form onSubmit={envoi}>
                <h2>Ajouter / Modifier une carte</h2>

                <label>Choisir une carte :</label>
                <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value === "new" ? "new" : Number(e.target.value))}>
                    <option value="new">Créer une nouvelle carte</option>
                    {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                            {card.name} (ID: {card.id})
                        </option>
                    ))}
                </select>

                <label>Nom de la carte :</label>
                <input
                    type="text"
                    placeholder="Nom de la carte"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                />

                <label>Recto ou Verso :</label>
                <select value={face} onChange={(e) => setFace(e.target.value as "front" | "back")}>
                    <option value="front">Recto</option>
                    <option value="back">Verso</option>
                </select>

                <input
                    type="text"
                    placeholder="Texte"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <input type="file" accept="image/*,audio/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                <button type="submit">Valider</button>
            </form>

            <div>
                <h2>Liste des cartes</h2>
                {cards.map((card) => (
                    <div key={card.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", textAlign: "center" }}>
                        <h3>{card.name}</h3>
                        <p><strong>Niveau:</strong> {card.level || 0} / 10</p>

                        {visibleSide[card.id!] !== "back" ? (
                            <div>
                                <p>{card.frontText}</p>
                                {card.frontMedia && <p>{card.frontMedia}</p>}
                            </div>
                        ) : (
                            <div>
                                <p>{card.backText}</p>
                                {card.backMedia && <p>{card.backMedia}</p>}
                                <button onClick={() => modifierNiveau(card.id!, 1)}>✅ Réussi</button>
                                <button onClick={() => modifierNiveau(card.id!, -1)}>❌ Raté</button>
                            </div>
                        )}

                        <button onClick={() => toggleSide(card.id!)}>
                            {visibleSide[card.id!] === "back" ? "Voir le recto" : "Voir le verso"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
