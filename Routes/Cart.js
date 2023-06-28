const express = require("express")
const Cart = require("../Models/Cartschema")
const AsyncError = require("../Error/AsyncError")
const fetchUser = require("../Utilitis/User")
const ErrorHandler = require("../Error/ErrorHandling")
const route = express.Router()
//  Will have to set cart schema and route
route.post('/new-cart', fetchUser, AsyncError(async (req, res, next) => {
    const CartData = await Cart.findOne({ userId: req.user.id })
    const totalPrice = req.body.price * req.body.quantity
    const actualPrice = req.body.comparePrice === undefined ? totalPrice : req.body.comparePrice * req.body.quantity
    const totalSaved = actualPrice - totalPrice
    if (!CartData) {
        const cartData = await new Cart({
            userId: req.user.id,
            items: [req.body],
            totalPrice,
            actualPrice,
            totalSaved
        }).save()
        res.status(200).send({ success: true, data: cartData, message: "Added to cart" })
    }
    else {
        const isItem = CartData.items.find(
            (element) => element.productId.toString() === req.body.productId.toString()
        );
        if (isItem) {
            CartData.items.forEach((element) => {
                if (element.productId.toString() === req.body.productId.toString())
                    (element.quantity = element.quantity + req.body.quantity)
            });
            CartData.totalPrice = CartData.totalPrice + totalPrice
            CartData.actualPrice = CartData.actualPrice + actualPrice
            CartData.totalSaved = CartData.totalSaved + totalSaved
            const cartData = await CartData.save()
            res.status(200).send({ success: true, data: cartData, message: "Added to cart" })
        } else {
            CartData.items.push(req.body)
            CartData.totalPrice = CartData.totalPrice + totalPrice
            CartData.actualPrice = CartData.actualPrice + actualPrice
            CartData.totalSaved = CartData.totalSaved + totalSaved
            const cartData = await CartData.save()
            res.status(200).send({ success: true, data: cartData, message: "Added to cart" })
        }
    }
}))

route.post('/update-cart', fetchUser, AsyncError(async (req, res, next) => {
    if(req.body.quantity === 0 || req.body.quantity === undefined){
       return next(new ErrorHandler("Quantity Can not less than one, You can remove the product from cart!", 400))
    }
    const CartData = await Cart.findOne({ userId: req.user.id })
    if (!CartData) {
        return next(new ErrorHandler("cart not found", 404))
    }
    const isItem = CartData.items.find(
        (element) => element.productId.toString() === req.body.productId.toString()
    );
    if (!isItem) return next(new ErrorHandler("product not found", 404))
    let calQ = req.body.quantity - isItem.quantity
    const totalPrice = isItem.price * calQ
    const actualPrice = isItem.comparePrice === undefined ? totalPrice : isItem.comparePrice * calQ
    const totalSaved = actualPrice - totalPrice
    CartData.items.forEach((element) => {
        if (element.productId.toString() === req.body.productId.toString())
            (element.quantity = req.body.quantity)
    });
    CartData.totalPrice = CartData.totalPrice + totalPrice
    CartData.actualPrice = CartData.actualPrice + actualPrice
    CartData.totalSaved = CartData.totalSaved + totalSaved
    const cartData = await CartData.save()
    res.status(200).send({ success: true, data: cartData, message: "Added to cart" })
}))

route.post('/remove-cart-item', fetchUser, AsyncError(async (req, res, next) => {
    const cartData = await Cart.findOne({ userId: req.user.id });
    if (!cartData) {
      return next(new ErrorHandler("Cart Item not found", 404));
    }
    const itemIndex = cartData.items.findIndex(
      (item) => item.productId.toString() === req.body.productId.toString()
    );
    if (itemIndex === -1) {
      return next(new ErrorHandler("Cart Item not found", 404));
    }
    const item = cartData.items[itemIndex];
    const totalPrice = item.price * item.quantity;
    const actualPrice = item.comparePrice === undefined ? totalPrice : item.comparePrice * item.quantity;
    const totalSaved = actualPrice - totalPrice;
    cartData.items.splice(itemIndex, 1);
    cartData.totalPrice -= totalPrice;
    cartData.actualPrice -= actualPrice;
    cartData.totalSaved -= totalSaved;
    const updatedCartData = await cartData.save();
    res.status(200).send({ success: true, data: updatedCartData, message: "Removed from cart" });
}));

route.post('/checkout-cart', fetchUser, AsyncError(async (req, res, next) => {
    const cartData = await Cart.findById(req.body.id);
    if (!cartData) {
      return next(new ErrorHandler("Cart Item not found", 404));
    }
    if (cartData.items.length === 0) {
      return next(new ErrorHandler("Cart is Empty", 400));
    }
    cartData.isCheckout = true;
    await cartData.save();
    res.status(200).send({ success: true});
}));

route.post('/get-cart-items', fetchUser, AsyncError(async (req, res) => {
    const CartData = await Cart.findOne({ userId: req.user.id })
    if(!CartData) return res.status(400).send({success: true, message: "Cart Is Empty" , isCartItem: false })
    res.status(200).send({ success: true, data: CartData, message: CartData.items.length === 0 ? "Cart is Empty" : "", isCartItem: CartData.items.length === 0 ? false : true  })
}))
  

module.exports = route