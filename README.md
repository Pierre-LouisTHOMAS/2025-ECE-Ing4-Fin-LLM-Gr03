# Interface de Chat avec EXAONE

Bienvenue sur le projet de Esteban, Lucas et Pierre-Louis. Cette application permet de discuter avec le modèle d'intelligence artificielle EXAONE via une interface graphique élégante.

## Architecture du projet

Le projet est composé de deux parties principales :

1. **Backend** : Une API REST développée avec FastAPI qui communique avec le modèle EXAONE
2. **Frontend** : Une interface utilisateur développée avec React et TypeScript

## Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :

- Python 3.8+ pour le backend
- Node.js 14+ et npm pour le frontend
- Git pour cloner le dépôt

## Installation

### 1. Cloner le dépôt

```bash
git clone [URL_DU_DÉPÔT]
cd [NOM_DU_DOSSIER_CLONÉ]
```

### 2. Configuration du backend

```bash
# Créer et activer un environnement virtuel Python
python -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installer les dépendances
pip install fastapi uvicorn transformers torch
```

### 3. Configuration du frontend

```bash
cd frontend
npm install
```

## Lancement de l'application

### 1. Démarrer le backend

Dans un premier terminal :

```bash
# Depuis la racine du projet, avec l'environnement virtuel activé
uvicorn Backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Le serveur backend sera accessible à l'adresse : http://0.0.0.0:8000

### 2. Démarrer le frontend

Dans un second terminal :

```bash
cd frontend
npm start
```

L'application frontend sera accessible à l'adresse : http://localhost:3000

## Utilisation

1. Ouvrez votre navigateur et accédez à http://localhost:3000
2. Vous verrez l'interface de chat avec un message d'accueil du modèle
3. Saisissez votre message dans la zone de texte en bas et cliquez sur "Envoyer"
4. Le modèle EXAONE vous répondra en français

## Fonctionnalités

- Interface utilisateur élégante avec un thème sombre
- Communication en temps réel avec le modèle EXAONE
- Affichage des messages utilisateur et des réponses du modèle
- Indicateur de chargement pendant la génération de la réponse
- Gestion des erreurs de communication avec le backend

## Dépannage

- Si vous rencontrez des erreurs de connexion, assurez-vous que le backend est bien en cours d'exécution
- Vérifiez les logs dans la console du navigateur pour identifier les problèmes potentiels
- Si le modèle ne répond pas correctement, vérifiez que vous avez bien installé toutes les dépendances Python

## Développement

Le code source est organisé comme suit :

- `Backend/app/main.py` : API FastAPI qui communique avec le modèle EXAONE
- `frontend/src/components/` : Composants React de l'interface utilisateur
- `frontend/src/services/` : Services pour la communication avec l'API backend

---

Développé par Esteban, Lucas et Pierre-Louis dans le cadre d'un projet d'Intelligence Artificielle à l'ECE Paris.