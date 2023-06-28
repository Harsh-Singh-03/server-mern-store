const mongoose = require('mongoose');
//  TODO
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
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
    offer:[
      {
          Coupen: {
              type: String,
              default: "launch Offer"
          },
          offerDescription: {
              type: "String",
              default: "20% Off"
          },
          offerOffPrice:{
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
  isCheckout: {
    type: Boolean,
    default: false
  },
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

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart
