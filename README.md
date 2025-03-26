<img src="https://foundations.projectpythia.org/_images/GitHub-logo.png" style=justify-content:center;>

<p style="text-align:right;text-decoration:underline;font-size:18px;">CE</p>

<p style="text-decoration:underline;font-size:14px;">25/03/2025</p>

# Projet PWA Memory

## Description
L'application permet de réviser des thèmes. Les thèmes contiennent un ensemble de carte de révision, dont il faut se souvenir de ce qui est affiché au verso en fonction du recto de la carte. Le verso comme le recto peut contenir du texte, et/ou un élément multimédia (image, son, vidéo). Les thèmes sont regroupés par catégorie.

**L'utilisateur peut donc créer ses propres catégories, y ajouter des thèmes et pour chaque thème créer des cartes de révision.**

L'utilisateur peut ensuite commencer la révision d'un ou plusieurs thèmes, en choisissant le nombre de niveau qu'il souhaite pour chaque thème, et le nombre de nouvelles cartes vues chaque jour.
Chaque jour, la révision d'un thème commence par le niveau le plus haut, avec le nombre de nouvelles cartes choisies, puis avec le niveau 1.

L'application permettra à l'utilisateur de configurer un rappel quotidien, qui lui sera notifié si ce dernier accepte les notifications au niveau du navigateur.


## Installation et lancement
### Prérequis
1. [Node.js](https://nodejs.org/) et [npm](https://www.npmjs.com/) (pour le frontend).
2. Avoir un navigateur qui possède un [IndexDB](https://fr.javascript.info/indexeddb)

### Cloner le projet

    git clone https://github.com/Clementbrj/PWA

### Installation des dépendances

    cd frontend
    npm install


### Lancement de l'application
Avoir un terminal dans votre IDE et faites :

    cd PROJETWEB
    npm run dev

## Fonctionnalités principales

- **Création et gestion des catégories et des thèmes** : L'utilisateur peut créer des catégories, y ajouter des thèmes et, pour chaque thème, créer des cartes de révision.
- **Création et modification de cartes** : L'utilisateur peut ajouter une nouvelle carte via un formulaire en renseignant son titre, le texte du recto et du verso, ainsi qu'un élément multimédia (image/son). Il est également possible de modifier une carte existante en sélectionnant son ID ou son nom.
- **Réviser les cartes** : Lors de la révision, l'utilisateur voit la question affichée sur le recto de la carte et peut la retourner pour vérifier sa réponse. Si la réponse est correcte, le niveau de la carte augmente de 1. En cas d'erreur, le niveau revient à zéro.
- **Répétition espacée** : L'utilisateur peut personnaliser la révision en fonction des niveaux de difficulté et du nombre de cartes à voir chaque jour.
- **Notifications** : L'utilisateur peut activer des rappels quotidiens via des notifications de navigateur.
- **Mode hors-ligne** : L'application fonctionne sans connexion grâce à un service worker et un fichier MANIFEST.

### Modalités de réalisation
Le projet a été réalisé en binôme, composé de **Ethan Bermond** et **Clément Barjolle**.

### Modalité de rendu
Le projet est hébergé sur **GitHub**

## Organisation du code
### Dossier dev-dist

    Service Worker : Gère l'utilisation hors ligne de l'application.

### Dossier src
**Sous-dossier bdd**


    bdd.tsx : Ce fichier est responsable de la déclaration et de la création de la base de données IndexedDB.


**Sous-dossier component**

    Cartes.tsx : Ce composant gère les opérations CRUD pour les cartes de révision.

    Categorie.tsx : Ce composant gère les catégories, permettant aux utilisateurs de créer, afficher, modifier et supprimer des catégories. Il inclut également la logique pour la suppression en cascade dans l'indexedDB.

    Theme.tsx : Ce composant gère les thèmes au sein d'une catégorie. Il permet aux utilisateurs d'ajouter, afficher, modifier et supprimer des thèmes. Il inclut également la logique pour la suppression en cascade dans l'indexedDB.


**Sous-dossier css**

    Fichiers CSS : Ces fichiers contiennent les styles pour les composants respectifs (Cartes.css, Cat.css, Theme.css).


**Fichiers de configuration**

    tsconfig.* : Ces fichiers configurent TypeScript pour le projet, définissant les options de compilation et les modules nécessaires.

    vite.config.ts : Ce fichier configure Vite, le bundler utilisé pour le développement et la construction du projet.


**Autres fichiers**

    index.html : Le fichier HTML principal qui sert de point d'entrée pour l'application.

    main.tsx : Le point d'entrée de l'application React, où l'application est rendue dans le DOM.

    .gitignore : Ce fichier spécifie les fichiers et dossiers à ignorer par Git.

    package.json et package-lock.json : Ces fichiers gèrent les dépendances du projet.


## Choix technologiques
- React Vite : Typescript, permet d'avoir un Front-End typé, pour une meilleur organisation et qualité/fiabilité du code et de l'utilisation des variables

- React-Router-Dom : Pour la navigation entre les 3 composants de la PWA

- IndexedDB : Pour le stockage locale des données

## Documentations
### Outils

    ChatGPT
    Mistral

### Sources

[TypeScript](https://www.typescriptlang.org/docs/)

[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

[StackOverflow](https://stackoverflow.com/questions/tagged/indexeddb+typescript)

<div style="display: flex; align-items: center;flex-direction:column; gap: 10   px;">
    <img src="https://octodex.github.com/images/daftpunktocat-thomas.gif" 
         alt="GG" width="400">

<a style="font-size:15px" href="https://octodex.github.com/">Ref</a>

