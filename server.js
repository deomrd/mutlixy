// Importation des dépendances nécessaires
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes'); // Routes des utilisateurs
const { login, refreshAccessToken, verifyAccessToken, logout, loginLimiter } = require('./controllers/authController'); // Assure-toi d'importer le bon chemin

// Chargement des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();

// Middlewares
app.use(cors()); // Pour gérer les CORS
app.use(morgan('dev')); // Logger des requêtes HTTP
app.use(express.json()); // Pour pouvoir traiter les requêtes avec des données JSON
app.use(cookieParser()); // Pour gérer les cookies (notamment pour le refresh token)

// Connexion à la base de données Prisma pour vérifier la connexion
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('Base de données connectée avec succès');
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base de données:', err);
  });

// Routes
app.use('/api/users', userRoutes); // Les routes pour les utilisateurs sont préfixées par "/api/users"

// Route de connexion
app.post('/login', loginLimiter, login); // Limite les tentatives de connexion
app.post('/refresh-token', refreshAccessToken);
app.post('/logout', logout);

// Route protégée
app.get('/protected-route', verifyAccessToken, (req, res) => {
  res.status(200).json({
    message: 'Accès autorisé à la route protégée',
    user: req.user, // Accès aux informations de l'utilisateur
  });
});

// Route par défaut pour tester que l'API fonctionne
app.get('/', (req, res) => {
  res.send('API fonctionne!');
});

// Gestion des erreurs non trouvées (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée' });
});

// Gestion des erreurs générales (500)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
