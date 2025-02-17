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
                level: 1,
                nextReview: Date.now(),
            };

            const addRequest = cardStore.add(newCard);
            addRequest.onsuccess = () => AfficheCartes();
        } else {
            const getRequest = cardStore.get(selectedCardId);
            getRequest.onsuccess = () => {
                const existingCard = getRequest.result as Card;

                existingCard.name = cardName;
                existingCard.frontText = frontText || existingCard.frontText;
                existingCard.frontMedia = frontMediaName || existingCard.frontMedia;
                existingCard.backText = backText || existingCard.backText;
                existingCard.backMedia = backMediaName || existingCard.backMedia;

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
            const card = getRequest.ressult as Card;
            if (!card) return;

            if (increment > 0) {
                card.level = (card.level || 1) + increment;
                card.nextReview = Date.now() + Math.pow(2, card.level) * 24 * 60 * 60 * 1000;
            } else {
                card.level = 1;
                card.nextReview = Date.now();
            }

            const updateRequest = cardStore.put(card);
            updateRequest.onsuccess = () => AfficheCartes();
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
                <input type="text" placeholder="Nom de la carte" value={cardName} onChange={(e) => setCardName(e.target.value)} />

                <label>Recto :</label>
                <input type="text" placeholder="Texte du recto" value={frontText} onChange={(e) => setFrontText(e.target.value)} />
                <input type="file" accept="image/*,audio/*,video/*" onChange={(e) => setFrontMedia(e.target.files?.[0] || null)} />

                <label>Verso :</label>
                <input type="text" placeholder="Texte du verso" value={backText} onChange={(e) => setBackText(e.target.value)} />
                <input type="file" accept="image/*,audio/*,video/*" onChange={(e) => setBackMedia(e.target.files?.[0] || null)} />

                <button type="submit">Valider</button>
            </form>

            <div>
                <h2>Cartes à réviser</h2>
                {cardsToReview.map((card) => (
                    <div key={card.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", textAlign: "center" }}>
                        <h3>{card.name} - Niveau : {card.level}</h3>

                        {visibleSide[card.id!] !== "back" ? (
                            <div>
                                <p>{card.frontText}</p>
                                {card.frontMedia && <p>📂 {card.frontMedia}</p>}
                            </div>
                        ) : (
                            <div>
                                <p>{card.backText}</p>
                                {card.backMedia && <p>📂 {card.backMedia}</p>}
                                <button onClick={() => modifierNiveau(card.id!, 1)}>✔️ Réussi</button>
                                <button onClick={() => modifierNiveau(card.id!, 0)}>❌ Raté</button>
                            </div>
                        )}

                        <button onClick={() => toggleSide(card.id!)}>Voir {visibleSide[card.id!] === "back" ? "le recto" : "le verso"}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
