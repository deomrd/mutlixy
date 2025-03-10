const bcrypt = require('bcryptjs');
const { sendErrorMessage } = require('../services/errorService');
const { handleTryCatch } = require('../services/tryCatchService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); 

// Fonction pour récupérer un utilisateur par son ID, avec ses relations (commandes, panier, etc.)
const getUserById = async (req, res) => {
  const { id } = req.params; // Récupère l'ID de l'utilisateur dans les paramètres de la requête

  await handleTryCatch(async () => {
    // Recherche l'utilisateur avec ses relations (commandes, panier, etc.)
    const user = await prisma.user.findUnique({
      where: { id_user: parseInt(id) }, // Utilise l'ID passé dans l'URL
      include: {
        orders: true, // Inclut les commandes de l'utilisateur
        cart: true, // Inclut les articles du panier
        productReviews: true, // Inclut les avis produits
        wishlist: true, // Inclut les éléments de la wishlist
        supportMessages: true, // Inclut les messages de support
        administrator: true, // Inclut l'administrateur s'il existe
      },
    });

    // Si l'utilisateur n'est pas trouvé, on renvoie une erreur 404
    if (!user) {
      throw { code: 404, message: "Utilisateur non trouvé." };
    }

    // Si l'utilisateur est trouvé, on renvoie les informations de l'utilisateur avec ses relations
    res.status(200).json(user);
  }, res);
};

// Fonction pour créer un nouvel utilisateur
const createUser = async (req, res) => {
  const { first_name, last_name, email, password, address, phone, role } = req.body;

  await handleTryCatch(async () => {
    // Validation basique de la requête
    if (!first_name || !last_name || !email || !password) {
      throw { code: 400, message: 'Les champs requis (prénom, nom, email, mot de passe) sont obligatoires' };
    }

    // Vérification si l'email est déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw { code: 400, message: 'Un utilisateur avec cet email existe déjà' };
    }

    // Hachage du mot de passe avant de l'enregistrer
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur dans la base de données
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword, // Utilisation du mot de passe haché
        address,
        phone,
        role,
      },
    });

    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès', user: newUser });
  }, res);
};

// Fonction pour mettre à jour un utilisateur
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { first_name, last_name, email, password, address, phone, role } = req.body;

  await handleTryCatch(async () => {
    // Recherche de l'utilisateur à mettre à jour
    const user = await prisma.user.findUnique({
      where: { id_user: Number(userId) },
    });

    if (!user) {
      throw { code: 404, message: 'Utilisateur non trouvé' };
    }

    // Hachage du mot de passe si un nouveau mot de passe est fourni
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Mise à jour des informations de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id_user: Number(userId) },
      data: {
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        password: hashedPassword || user.password, // Si un nouveau mot de passe est donné, il est haché
        address: address || user.address,
        phone: phone || user.phone,
        role: role || user.role,
      },
    });

    res.status(200).json({ success: true, message: 'Utilisateur mis à jour avec succès', user: updatedUser });
  }, res);
};

// Fonction pour supprimer un utilisateur (soft delete)
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  await handleTryCatch(async () => {
    // Recherche de l'utilisateur à supprimer
    const user = await prisma.user.findUnique({
      where: { id_user: Number(userId) },
    });

    if (!user) {
      throw { code: 404, message: 'Utilisateur non trouvé' };
    }

    // Soft delete : On marque l'utilisateur comme supprimé
    const deletedUser = await prisma.user.update({
      where: { id_user: Number(userId) },
      data: {
        is_deleted: true,
      },
    });

    res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès', user: deletedUser });
  }, res);
};

module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
