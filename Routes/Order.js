const express = require("express")
const AsyncError = require("../Error/AsyncError")
const fetchUser = require("../Utilitis/User")
const ErrorHandler = require("../Error/ErrorHandling")
const Order = require("../Models/Orderschema")
const User = require("../Models/Userschema")
const Cart = require("../Models/Cartschema")
const route = express.Router()
// Route for creating order initially when user proceed for payment
route.post('/create-order', fetchUser, AsyncError(async (req, res, next) => {
    const cartQuery = {
        userId: req.user.id,
        _id: req.body.CartID
    }
    const customer = await User.findById(req.user.id)
    const CartData = await Cart.findOne(cartQuery)
    if(!CartData || !CartData.items || !CartData.totalPrice || !customer){
        return next(new ErrorHandler("Bad Request", 400))
    }
    const orderDetails = {
        userId: customer._id || req.user.id,
        customer: {
            name: customer.name,
            email: customer.email,
            avatar: customer.avatar,
            Addresses: req.body.address
        },
        CartID: CartData._id,
        lineItems: CartData.items,
        totalPrice: CartData.totalPrice,
        actualPrice: CartData.actualPrice,
        totalSaved: CartData.totalSaved
    }
    const createOrder = await new Order(orderDetails).save()
    res.status(200).send({success: true, message: "order-created", orderId: createOrder._id})
}))
// Route for updating order details when user successfully placed order
route.post('/placed-order', AsyncError(async (req, res, next) =>{
    const {payment, orderStatus, orderID} = req.body
    const OrderData = await Order.findById(orderID)
    if(!OrderData) return next(new ErrorHandler("Bad Request", 400))
    OrderData.payment = payment;
    OrderData.orderStatus = orderStatus;
    OrderData.orderStatusUrl = `/checkout/thank-you/${orderID}`;
    await OrderData.save();
    await Cart.findByIdAndDelete(OrderData.CartID) 
    res.status(200).send({success: true, message: "Order Placed Successfully"})
}))
// Route for getting single order data
route.get('/get-order',AsyncError(async (req, res, next) =>{
    const OrderData = await Order.findById(req.query.id)
    if(!OrderData) return next(new ErrorHandler("Bad Request", 400))
    res.status(200).send({success: true, OrderData})
}))
// Get all orders of a particuler customer 
route.get('/get-customer-orders',AsyncError(async (req, res, next) =>{
    const OrderData =  await Order.find({userId: req.query.id })
    if(!OrderData) return next(new ErrorHandler("Bad Request", 400))
    res.status(200).send({success: true, OrderData})
}))

module.exports = route