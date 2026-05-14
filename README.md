# APPMobileReact

Application mobile de messagerie instantanée construite avec **React Native + Expo**.
Le projet inclut l’authentification, les conversations privées et de groupe, l’envoi de médias et les appels audio/vidéo via Agora.

## Fonctionnalités principales

- Authentification utilisateur (connexion / inscription)
- Messagerie 1:1
- Groupes de discussion
- Galerie média et partage de contenus
- Historique des appels
- Appels audio/vidéo (Agora)
- Thème (clair/sombre/auto) + préférences utilisateur
- Interface multilingue (English, Français, Arabic, Español)

## Stack technique

- **Frontend mobile**: React Native 0.81 + Expo 54
- **Navigation**: React Navigation (stack + tabs)
- **Backend temps réel**: Firebase (Auth + Realtime Database + Storage)
- **Appels audio/vidéo**: `react-native-agora`
- **Token server Agora (optionnel recommandé)**: Node.js + Express
- **Stockage local**: AsyncStorage

## Prérequis

- Node.js 18+
- npm
- Expo CLI (via `npx expo ...`)
- Android Studio (Android) et/ou Xcode (iOS)

## Installation

```bash
cd /home/runner/work/APPMobileReact/APPMobileReact
npm install
```

## Lancer l’application

```bash
npm run start
```

Scripts disponibles :

- `npm run start` : démarre Expo
- `npm run android` : lance Expo sur Android
- `npm run ios` : lance Expo sur iOS
- `npm run web` : lance la version web
- `npm run start:dev` : démarre avec Expo Dev Client
- `npm run android:dev` : build/run Android natif
- `npm run ios:dev` : build/run iOS natif

## Configuration Agora (appels)

Le projet utilise une configuration dans `Config/agora.js` et un serveur de token local optionnel.

### 1) Variables d’environnement du serveur token

Copier `.env.example` vers `.env` à la racine puis renseigner :

```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
TOKEN_SERVER_PORT=5050
```

### 2) Lancer le serveur token

```bash
npm run token-server
```

Le serveur expose : `GET /rtc-token` (par défaut `http://localhost:5050/rtc-token`).

### 3) Vérifier l’URL côté app

Dans `Config/agora.js`, l’URL par défaut est :

```js
export const AGORA_TOKEN_SERVER_URL = "http://localhost:5050/rtc-token";
```

> Sur appareil physique, remplacez `localhost` par l’IP locale de la machine qui exécute le serveur token.

## Permissions mobiles

Déclarées dans `app.json` :

- Caméra
- Microphone
- Stockage (lecture/écriture)
- Localisation (fine/coarse)

## Structure rapide du projet

- `App.js` : point d’entrée + navigation principale
- `Screens/` : écrans de l’application (auth, chat, appel, etc.)
- `Screens/Home/` : onglets principaux (chats, groupes, appels, profil)
- `Config/` : config Firebase/Supabase, thèmes, traductions, paramètres app
- `components/ui/` : composants UI réutilisables
- `agora-token-server.js` : serveur Express de génération de token Agora

## Notes importantes

- L’écran d’appel natif nécessite un **Dev Client** ou une build native (pas Expo Go).
- Le projet ne fournit pas de scripts de test/lint dédiés dans `package.json` actuellement.

## Auteur

Projet APPMobileReact – dépôt `ibtissemitbs/APPMobileReact`.
