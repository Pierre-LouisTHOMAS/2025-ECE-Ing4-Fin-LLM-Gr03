# Qwen Chat - Application de Chat avec Intelligence Artificielle

Cette application vous permet de discuter avec une IA capable de comprendre le texte et les images. Voici comment l'installer et la faire fonctionner sur votre ordinateur.

## Prérequis

Vous aurez besoin de :
- Python 3.10 ou plus récent
- Node.js et npm
- Un ordinateur Mac avec puce Apple Silicon (M1, M2, etc.) pour de meilleures performances

## Installation

### 1. Télécharger le code

```bash
git clone https://github.com/Pierre-LouisTHOMAS/2025-ECE-Ing4-Fin-LLM-Gr03.git
cd 2025-ECE-Ing4-Fin-LLM-Gr03
```

### 2. Installer le backend

```bash
# Créer un environnement virtuel Python
python -m venv .venv

# Activer l'environnement virtuel
source .venv/bin/activate  # Sur Mac/Linux
# ou
.venv\Scripts\activate  # Sur Windows

# Installer les dépendances
cd Backend
pip install -r requirements.txt
```

### 3. Installer le frontend

```bash
cd frontend
npm install
```

## Lancement de l'application

### 1. Démarrer le backend

Dans un premier terminal (assurez-vous que l'environnement virtuel est activé) :

```bash
cd Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Démarrer le frontend

Dans un second terminal :

```bash
cd frontend
npm start
```

L'application s'ouvrira automatiquement dans votre navigateur à l'adresse http://localhost:3000

## Utilisation

1. **Discuter avec l'IA** : Tapez votre message dans la zone de texte en bas et appuyez sur Entrée
2. **Envoyer une image** : Cliquez sur l'icône d'image et sélectionnez une image à analyser
3. **Créer une nouvelle conversation** : Cliquez sur le bouton "+" dans la barre latérale
4. **Changer de conversation** : Cliquez sur une conversation dans la liste à gauche

## Fonctionnalités

- Chat textuel avec l'IA
- Analyse d'images
- Mémoire des conversations
- Interface simple et intuitive

## Résolution des problèmes

- Si le backend ne démarre pas, vérifiez que vous avez bien installé toutes les dépendances
- Si le frontend ne se connecte pas au backend, vérifiez que le serveur backend est bien en cours d'exécution
- Si l'application est lente, c'est normal lors du premier démarrage car le modèle d'IA doit se charger

---

Développé par Esteban, Lucas et Pierre-Louis dans le cadre d'un projet d'Intelligence Artificielle à l'ECE Paris.