/**
 * index.ts
 * Démarrage du serveur HTTP.
 * Lit la configuration depuis les variables d'environnement et lance le serveur.
 */

import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
