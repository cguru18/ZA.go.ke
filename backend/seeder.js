const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
    // Normal Products (Visible to everyone)
    { title: "Classic Chocolate Chip Cookie", thc: "0mg", price: 150, color: "yellow", category: "Cookies", isInfused: false },
    { title: "Strawberry Bliss Smoothie", thc: "0mg", price: 300, color: "burgundy", category: "Drinks", isInfused: false },
    { title: "Assorted Gummy Bears", thc: "0mg", price: 100, color: "blue", category: "Sweets", isInfused: false },
    { title: "Vanilla Fudge", thc: "0mg", price: 120, color: "yellow", category: "Sweets", isInfused: false },
    { title: "Fresh Lemonade", thc: "0mg", price: 200, color: "jade", category: "Drinks", isInfused: false },
    
    // Infused Products (Require Code)
    { title: "Purple Haze Gummy", thc: "25mg", price: 300, color: "lilac", category: "Edibles", isInfused: true },
    { title: "Forest Kush Brownie", thc: "50mg", price: 250, color: "jade", category: "Edibles", isInfused: true },
    { title: "Smoothie: Velvet Dream", thc: "Infused", price: 450, color: "burgundy", category: "Drinks", isInfused: true },
    { title: "Edible Cookies", thc: "15mg", price: 200, color: "yellow", category: "Edibles", isInfused: true },
    { title: "CBD Chill Drops", thc: "50mg CBD", price: 1000, color: "blue", category: "Tinctures", isInfused: true },
    { title: "Golden Ticket Truffles", thc: "100mg", price: 800, color: "yellow", category: "Edibles", isInfused: true },
    { title: "Midnight Express Vape", thc: "85%", price: 3500, color: "purple", category: "Vapes", isInfused: true },
    { title: "Green Crack Pre-roll", thc: "20%", price: 500, color: "jade", category: "Flower", isInfused: true },
    { title: "Mango Tango Smoothie", thc: "Infused", price: 450, color: "yellow", category: "Drinks", isInfused: true },
    { title: "Berry Blast Gummies", thc: "30mg", price: 350, color: "burgundy", category: "Edibles", isInfused: true },
    { title: "Sour Diesel Flower (1g)", thc: "22%", price: 1200, color: "jade", category: "Flower", isInfused: true },
    { title: "Lemon Haze Cartridge", thc: "80%", price: 2800, color: "yellow", category: "Vapes", isInfused: true },
    { title: "Sleepy Time Tea", thc: "10mg", price: 300, color: "lilac", category: "Drinks", isInfused: true },
    { title: "Space Cake", thc: "150mg", price: 1500, color: "purple", category: "Edibles", isInfused: true },
    { title: "Mint Magic Tincture", thc: "500mg", price: 2500, color: "blue", category: "Tinctures", isInfused: true },
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zago');
        await Product.deleteMany();
        await Product.insertMany(products);
        console.log('Products Seeded!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedProducts();
