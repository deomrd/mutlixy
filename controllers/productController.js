const { sendErrorMessage } = require('../services/errorService');
const { handleTryCatch } = require('../services/tryCatchService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les produits avec leurs relations
const getAllProducts = async (req, res) => {

  await handleTryCatch(async () => {
    try {
      await prisma.$connect(); 

      const products = await prisma.product.findMany({
        where: { is_deleted: false },
        include: {
          category: true,
          orderDetails: true,
          productReviews: true,
          stockHistory: true,
          cart: true,
          wishlist: true,
          orderReturns: true,
        },
      });

      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  }, res);
};


// Récupérer un produit par son ID avec ses relations
const getProductById = async (req, res) => {
  const { id } = req.params;

  await handleTryCatch(async () => {
    const product = await prisma.product.findUnique({
      where: { id_product: parseInt(id) },
      include: {
        category: true,
        orderDetails: true,
        productReviews: true,
        stockHistory: true,
        cart: true,
        wishlist: true,
        orderReturns: true,
      },
    });

    if (!product || product.is_deleted) {
      throw { code: 404, message: "Produit non trouvé." };
    }

    res.status(200).json(product);
  }, res);
};

// Créer un nouveau produit
const createProduct = async (req, res) => {
  const { name, description, price, stock, image, id_category } = req.body;

  await handleTryCatch(async () => {
    if (!name || !price || !stock || !id_category) {
      throw { code: 400, message: 'Les champs obligatoires (name, price, stock, id_category) doivent être remplis' };
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        image,
        id_category: parseInt(id_category),
      },
    });

    res.status(201).json({ success: true, message: 'Produit créé avec succès', product: newProduct });
  }, res);
};

// Mettre à jour un produit
const updateProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, description, price, stock, image, id_category } = req.body;

  await handleTryCatch(async () => {
    const existingProduct = await prisma.product.findUnique({
      where: { id_product: productId },
    });

    if (!existingProduct || existingProduct.is_deleted) {
      throw { code: 404, message: 'Produit non trouvé' };
    }

    const updatedProduct = await prisma.product.update({
      where: { id_product: productId },
      data: {
        name: name !== undefined ? name : existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        image: image !== undefined ? image : existingProduct.image,
        id_category: id_category !== undefined ? parseInt(id_category) : existingProduct.id_category,
      },
    });

    res.status(200).json({ success: true, message: 'Produit mis à jour avec succès', product: updatedProduct });
  }, res);
};

//  Supprimer un produit (soft delete)
const deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id);

  await handleTryCatch(async () => {
    const product = await prisma.product.findUnique({
      where: { id_product: productId },
    });

    if (!product || product.is_deleted) {
      throw { code: 404, message: 'Produit non trouvé' };
    }

    const deletedProduct = await prisma.product.update({
      where: { id_product: productId },
      data: { is_deleted: true },
    });

    res.status(200).json({ success: true, message: 'Produit supprimé avec succès', product: deletedProduct });
  }, res);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
