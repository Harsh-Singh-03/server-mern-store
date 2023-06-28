const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        name: {
            type: String,
            required: [true, "Please Enter Your Name"],
        },
        email: {
            type: String,
            required: [true, "Please Enter Your Email"],
        },
        avatar: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        Addresses: {
            houseName: { type: String, default: "Optional" },
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zip: { type: String, required: true },
            country: { type: String, required: true },
            default: { type: Boolean, default: false }
        }

    },
    orderStatus: {
        type: String,
        required: true,
        default: 'Requested'
    },
    shipment: {
        shipmentStatus: {
            type: String,
            required: true,
            default: "Unfulfilled",
        },
        TrackingID: {
            type: String,
        },
        TrackingUrl: {
            type: String
        }
    },
    CartID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: true
    },
    payment: {
        paymentID: {
            type: String,
        },
        paymentMode: {
            type: String
        },
        paymentStatus: {
            type: String,
            required: true,
            default: "Not Paid"
        }
    },
    orderStatusUrl: {
        type: String,
    },
    lineItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: [true, "Please Enter product Name"],
        },
        brand: {
            type: String,
        },
        ratings: {
            type: Number,
            default: 0,
        },
        numOfReviews: {
            type: Number,
            default: 0,
        },
        offer: [
            {
                Coupen: {
                    type: String,
                    default: "launch Offer"
                },
                offerDescription: {
                    type: "String",
                    default: "20% Off"
                },
                offerOffPrice: {
                    type: Number
                },
            }
        ],
        variant: {
            type: String,
            default: "later"
        },
        images: [
            {
                public_id: {
                    type: String,
                    required: true,
                },
                url: {
                    type: String,
                    required: true,
                },
            },
        ],
        comparePrice: {
            type: Number,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    actualPrice: {
        type: Number,
        required: true
    },
    totalSaved: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Orders', orderSchema);
module.exports = Order
