const express = require("express")
const Product = require("../Models/Productschema")
const AsyncError = require("../Error/AsyncError")
const ErrorHandler = require("../Error/ErrorHandling");
const fetchUser = require("../Utilitis/User");
const User = require("../Models/Userschema");
const ApiFeatures = require("../Utilitis/Filter");
const Cart = require("../Models/Cartschema");
const stripe = require("stripe")(process.env.Stripe_Secret);

const route = express.Router()
// Admin Product Routes TODO Admin verify cart system
// Add product section for admin
route.post('/add-product', AsyncError(async (req, res, next) => {
    const product = new Product(req.body)
    const addEd = await product.save()
    res.status(200).json({ success: true, data: addEd, message: "product added successfully" })
}))
// Get all product --Admin
route.post('/get-all-product', AsyncError(async (req, res, next) => {
    const product = await Product.find();
    res.status(200).json({ success: true, data: product })
}))
// Product For Home Page
route.post('/get-all-product-test', AsyncError(async (req, res, next) => {
    const topOffers = await Product.find({ category: "topOffers" }).limit(8);
    const Mobile = await Product.find({ category: "Mobile" }).limit(8);
    const Fashion = await Product.find({ category: "Fashion" }).limit(8);
    const Electronics = await Product.find({ category: "Electronics" }).limit(8);
    const Appliances = await Product.find({ category: "Appliances" }).limit(8);
    const twoWheelers = await Product.find({ category: "twoWheelers" }).limit(8);
    const Home = await Product.find({ category: "Home" }).limit(8);
    const Grocery = await Product.find({ category: "Grocery" }).limit(8);
    res.status(200).json({ success: true, topOffers, Mobile, Fashion, Electronics, Home, Appliances, twoWheelers, Grocery })
}))
route.post('/get-price-brand', AsyncError(async (req, res, next) => {
    const Brand = await Product.distinct('brand', { category: req.body.category })
    const Price = await Product.aggregate([{ $match: { category: req.body.category } }, { $group: { _id: null, maxPrice: { $max: '$price' } } }])
    res.status(200).json({ success: true, maxPrice: Price[0].maxPrice, Brand })
}))
// route.post('/update', AsyncError(async (req, res, next) => {
//    const product = await Product.updateMany({ category: 'Two Wheelers' }, { $set: { category: 'twoWheelers' }})
//     res.status(200).json({ success: true, data: product })
// }))

// Get product user
route.get('/product-filter', AsyncError(async (req, res, next) => {
    const resultPerPage = 8;
    let productsCount = 0
    if (req.query.search === undefined) {
        let queryStr = JSON.stringify(req.query);
        let tempQuery = req.query
        if (tempQuery.page !== undefined) {
            const { page, ...newQuery } = tempQuery;
            queryStr = JSON.stringify(newQuery)
        }
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
        productsCount = await Product.countDocuments(JSON.parse(queryStr));
    } else {
        productsCount = await Product.countDocuments();
    }
    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resultPerPage)
    let products = await apiFeature.query;
    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        length: products.length,
        page: req.query.page || 1
    });
}))
// get single product
route.post('/get-single-product', AsyncError(async (req, res, next) => {
    const { id } = req.body
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }
    res.status(200).json({ success: true, data: product })
}))
// Update product --admin
route.put('/update-product', AsyncError(async (req, res, next) => {
    const { id, data } = req.body
    const Getproduct = await Product.findOne({ _id: id })
    if (!Getproduct) {
        return next(new ErrorHandler("Product not found", 404))
    }
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    res.status(200).json({ success: true, data: product, message: "Product Updated" })
}))
// Delete product --admin
route.delete('/delete-product', AsyncError(async (req, res, next) => {
    const { id } = req.body
    const Getproduct = await Product.findOne({ _id: id })
    if (!Getproduct) {
        return next(new ErrorHandler("Product not found", 404))
    }
    const product = await Product.findByIdAndDelete(id);
    res.status(200).json({ success: true, data: product, message: "Product Deleted" })
}))
//  Add a review (accept only logged in user and can add only 1 review)
route.post('/add-product-review', fetchUser, AsyncError(async (req, res, next) => {
    const { comment, rating, productID } = req.body
    const product = await Product.findById(productID)
    if (!product) { return next(new ErrorHandler("Product not found", 404)) }
    const isReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user.id.toString()
    );
    if (isReviewed) { return next(new ErrorHandler("You can add only 1 review", 400)) }
    const user = await User.findById(req.user.id)
    const review = {
        user: user._id,
        avatar: user.avatar,
        name: user.name,
        rating: rating,
        comment: comment
    }
    product.reviews.push(review)
    product.numOfReviews = product.reviews.length;
    let avg = 0;
    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });
    product.ratings = (avg / product.reviews.length).toFixed(1);
    await product.save()
    res.status(200).json({ success: true, data: review, message: "Review Added" })
}))
// Get all review
route.post('/get-reviews', AsyncError(async (req, res, next) => {
    const { productID } = req.body;
    const product = await Product.findById(productID)
    if (!product) { return next(new ErrorHandler("product not found", 404)) }
    res.status(200).json({ success: true, data: product.reviews })
}))
// Update review
route.post('/update-review', fetchUser, AsyncError(async (req, res, next) => {
    const { rating, comment, productID } = req.body
    const product = await Product.findById(productID)
    if (!product) { return next(new ErrorHandler("Product not found", 404)) }
    const isReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user.id.toString()
    );
    if (isReviewed) {
        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user.id.toString())
                (rev.rating = rating), (rev.comment = comment);
        });
    } else {
        return next(new ErrorHandler("Review not found", 404))
    }
    let avg = 0;
    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });
    product.ratings = avg / product.reviews.length;
    await product.save()
    res.status(200).json({ success: true, data: product.reviews, message: "review update" })
}))
// Delete review
route.post('/delete-review', fetchUser, AsyncError(async (req, res, next) => {
    const { productID } = req.body
    let product = await Product.findById(productID)
    if (!product) { return next(new ErrorHandler("Product not found", 404)) }
    const isReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user.id.toString()
    );
    if (!isReviewed) { return next(new ErrorHandler("Review not found", 404)) }
    const reviews = product.reviews.filter(
        (rev) => rev.user.toString() !== req.user.id.toString()
    );
    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }
    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(
        productID,
        {
            reviews,
            ratings,
            numOfReviews,
        }
    );
    res.status(200).json({ success: true, message: "Review Deleted" })
}))

route.post("/create-payment-intent", fetchUser, AsyncError(async (req, res, next) => {
    const query = {
        userId: req.user.id,
        _id: req.body.id
    }
    const items = await Cart.findOne(query)
    if (!items || !items.items || !items.totalPrice) {return next(new ErrorHandler('Cart Item not found', 404))}
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: items.totalPrice * 100,
        currency: "inr",
        metadata: {
            company: "Ecommerce",
        },
    });

    res.send({
        clientSecret: paymentIntent.client_secret,
        success: true
    });

}));

// 
// Filter product category and serch n all
// Image related task

module.exports = route