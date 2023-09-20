const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
    trim: true,
    minLength: [5, "Name should have more than 5 characters"],
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter product Price"],
  },
  comparePrice: {
    type: Number,
  },
  warrenty: {
    type: String,
  },
  brand: {
    type: String,
  },
  ratings: {
    type: Number,
    default: 0,
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
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
  },
  Highlights: [
    {
        Heighlight:{
            type: String,
            required: [true, "Please Enter Product Heightlights"],
            default: "Dummy"
        }
    }
  ],
  Stock: {
    type: Number,
    required: [true, "Please Enter product Stock"],
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  offer:[
    {
        Coupen: {
            type: String,
            default: "launch Oferr"
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
  Specifications:[
    {
        Spectype: {
            type: String,
            default: "Spec"
        },
        Spec: {
            type: String,
            default: "Brand Product"
        }
    }
  ],
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
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
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  customData: [
    {
      title: {
        type: String,
      },
      data: {
        type: String
      }
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product
// Tag variant