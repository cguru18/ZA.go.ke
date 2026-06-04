const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * GET /api/products
 * Multi-variable search algorithm with pagination and rating stats.
 */
router.get('/', async (req, res) => {
    try {
        const { unlocked, search, category, minPrice, maxPrice, inStock, sort, page = 1, limit = 50 } = req.query;
        let query = {};
        
        // Premium access toggle
        if (unlocked !== 'true') {
            query.isInfused = false;
        }

        // Text Search (Regex across title, description, category)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ];
        }

        // Category Filter
        if (category) {
            query.category = category;
        }

        // Price Filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Stock Filter
        if (inStock === 'true') {
            query.inStock = true;
        }

        // Sorting Logic
        let sortCriteria = { createdAt: -1 }; 
        if (sort === 'price') sortCriteria = { price: 1 };
        else if (sort === '-price') sortCriteria = { price: -1 };
        else if (sort === 'newest') sortCriteria = { createdAt: -1 };
        else if (sort === '-newest') sortCriteria = { createdAt: 1 };

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Fetch products with review stats using aggregation
        const products = await Product.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    avgRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
                    reviewCount: { $size: '$reviews' }
                }
            },
            { $sort: sortCriteria },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);
            
        const total = await Product.countDocuments(query);

        res.json({
            products,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/products
 * Upload new product (Protected & Admin Only)
 */
router.post('/', protect, admin, async (req, res) => {
    try {
        const { title, description, thc, price, category, isInfused, image } = req.body;
        
        const colors = { Flower: '#10b981', Edible: '#f59e0b', Concentrate: '#8b5cf6', Default: '#64748b' };
        const color = colors[category] || colors['Default'];

        const product = new Product({
            title, description, thc, price, category, color, isInfused, image,
            sellerId: req.user._id,
            inStock: true
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Product upload error:', error);
        res.status(500).json({ message: 'Failed to upload product' });
    }
});

/**
 * PATCH /api/products/:id/stock
 * Toggle stock status (Seller or Admin)
 */
router.patch('/:id/stock', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.sellerId && product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to modify this product' });
        }

        product.inStock = !product.inStock;
        await product.save();
        res.json({ inStock: product.inStock });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/products/:id/notify
 * Subscribe to restock notifications
 */
router.post('/:id/notify', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (!product.notifyList.includes(req.user._id)) {
            product.notifyList.push(req.user._id);
            await product.save();
        }
        res.json({ message: 'You will be notified when this item is restocked' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/products/:id/reviews
 * Submit a product review
 */
router.post('/:id/reviews', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const alreadyReviewed = await Review.findOne({ user: req.user._id, product: req.params.id });
        if (alreadyReviewed) return res.status(400).json({ message: 'Product already reviewed' });

        const review = new Review({
            user: req.user._id,
            product: req.params.id,
            rating: Number(rating),
            comment
        });

        await review.save();
        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/products/:id/reviews
 * Get all reviews for a specific product
 */
router.get('/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id })
            .populate('user', 'fullName')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/products/:id
 * Edit product details (Protected & Admin Only)
 */
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { title, description, thc, price, category, isInfused, image, ageLimit, inStock } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (title !== undefined) product.title = title;
        if (description !== undefined) product.description = description;
        if (thc !== undefined) product.thc = thc;
        if (price !== undefined) product.price = Number(price);
        if (category !== undefined) {
            product.category = category;
            const colors = { Flower: '#10b981', Edible: '#f59e0b', Concentrate: '#8b5cf6', Default: '#64748b' };
            product.color = colors[category] || colors['Default'];
        }
        if (isInfused !== undefined) product.isInfused = isInfused;
        if (image !== undefined) product.image = image;
        if (ageLimit !== undefined) product.ageLimit = ageLimit;
        if (inStock !== undefined) product.inStock = inStock;

        await product.save();
        res.json(product);
    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ message: 'Failed to update product' });
    }
});

module.exports = router;
