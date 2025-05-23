# Qwen Chat - Application de Chat IA Multimodale

Bienvenue sur le projet Qwen Chat développé par Esteban, Lucas et Pierre-Louis. Cette application permet de discuter avec le modèle d'intelligence artificielle Qwen via une interface graphique élégante, avec support pour le texte, les images et les documents PDF.

## Architecture du projet

Le projet est composé de deux parties principales :

1. **Backend** : Une API REST développée avec FastAPI qui communique avec le modèle Qwen
2. **Frontend** : Une interface utilisateur développée avec React et TypeScript

## Fonctionnalités

- **Chat textuel** : Conversation en temps réel avec le modèle Qwen
- **Analyse d'images** : Possibilité d'uploader des images pour que l'IA les analyse
- **Analyse de documents PDF** : Support pour l'upload et l'analyse de fichiers PDF
- **Système de mémoire** : L'IA retient les informations importantes sur l'utilisateur (prénom, préférences, etc.)
- **Interface utilisateur intuitive** : Design moderne avec thème sombre

## Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :

- Python 3.10 pour le backend (spécifiquement cette version pour la compatibilité avec MLX)
- Node.js 16+ et npm pour le frontend
- Git pour cloner le dépôt
- Mac avec puce Apple Silicon (M1/M2/M3) pour l'optimisation MLX

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Pierre-LouisTHOMAS/2025-ECE-Ing4-Fin-LLM-Gr03.git
cd 2025-ECE-Ing4-Fin-LLM-Gr03
```

### 2. Configuration du backend

**Important** : Ce projet utilise MLX, une bibliothèque optimisée pour Apple Silicon. Assurez-vous d'utiliser Python 3.10 spécifiquement.

```bash
python3.10 -m venv fresh_venv
source fresh_venv/bin/activate

cd Backend
pip install -r requirements.txt
```

Si le fichier requirements.txt n'existe pas, installez les dépendances suivantes :

```bash
pip install fastapi uvicorn python-multipart PyPDF2 Pillow requests mlx mlx_vlm
```

**Note** : Si vous rencontrez des erreurs avec MLX, assurez-vous d'utiliser Python 3.10 et non Python 3.13 ou une autre version.

### 3. Configuration du frontend

```bash
cd frontend
npm install
```

## Lancement de l'application

### 1. Démarrer le backend

Dans un premier terminal, assurez-vous d'activer l'environnement virtuel Python 3.10 :

```bash
source fresh_venv/bin/activate
python -m uvicorn Backend.app.main:app --host 0.0.0.0 --port 8000
```

**Note** : Utilisez `python -m uvicorn` plutôt que `uvicorn` directement pour garantir l'utilisation de la bonne version de Python.

Le serveur backend sera accessible à l'adresse : http://localhost:8000

### 2. Démarrer le frontend

Dans un second terminal :

```bash
cd frontend && npm start
```

L'application frontend sera accessible à l'adresse : http://localhost:3000

## Guide d'utilisation

1. **Démarrer une conversation** : Ouvrez votre navigateur et accédez à http://localhost:3000
2. **Envoyer un message texte** : Saisissez votre message dans la zone de texte en bas et cliquez sur l'icône d'envoi
3. **Envoyer une image** : Cliquez sur l'icône d'image à côté de la zone de texte, sélectionnez une image, puis posez une question à son sujet
4. **Envoyer un PDF** : Cliquez sur l'icône PDF, sélectionnez un document, puis posez une question sur son contenu
5. **Changer de conversation** : Utilisez le menu latéral pour créer une nouvelle conversation ou basculer entre les conversations existantes

## Structure des dossiers

```
├── Backend/
│   ├── app/
│   │   ├── main.py            # API FastAPI principale
│   │   ├── json_memory_service.py  # Service de gestion de la mémoire
│   │   └── old/               # Anciens fichiers conservés pour référence
│   └── data/                  # Stockage des données (conversations, etc.)
└── frontend/
    ├── public/                # Fichiers statiques
    └── src/
        ├── components/        # Composants React
        ├── services/          # Services pour la communication avec l'API
        └── App.tsx            # Composant principal de l'application
```

## Dépannage

- **Erreur de connexion au backend** : Vérifiez que le serveur backend est bien en cours d'exécution et accessible
- **Problèmes avec le modèle Qwen** : Assurez-vous que votre clé API est correctement configurée
- **Erreurs lors de l'upload de fichiers** : Vérifiez que les fichiers ne dépassent pas la taille limite (10 Mo)
- **Problèmes de mémoire** : Si l'IA ne se souvient pas des informations, vérifiez les fichiers JSON dans le dossier `Backend/data/memories`

## Développement

Pour contribuer au projet :

1. Créez une branche pour vos modifications : `git checkout -b ma-nouvelle-fonctionnalite`
2. Effectuez vos modifications et testez-les localement
3. Committez vos changements : `git commit -m "Description de mes modifications"`
4. Poussez vers la branche : `git push origin ma-nouvelle-fonctionnalite`
5. Créez une Pull Request sur GitHub

---

Développé par Esteban, Lucas et Pierre-Louis dans le cadre d'un projet d'Intelligence Artificielle à l'ECE Paris.