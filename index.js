const connectToMongo =require('./Utilitis/db')
const express = require('express')
require('dotenv/config')
var cors = require('cors');
const cloudinary = require('cloudinary').v2;
const cookieParser = require('cookie-parser')
const errorMiddleware = require("./Error/Error");

connectToMongo();

const app = express() 
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  optionsSuccessStatus: 200,
  credentials: true,
  methods: "GET,PUT,POST, DELETE"
}));

app.use(cookieParser());


cloudinary.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.Cloud_API_KEY,
  api_secret: process.env.Cloud_API_SECRET
});

app.get('/', (req, res) => {
  res.send('Hello harsh! We are running so well don,t worry !')
})

app.use(express.json())

app.use('/user/v1' ,require('./Routes/User'));
app.use('/product/v1' ,require('./Routes/Product'));
app.use('/cart/v1' ,require('./Routes/Cart'));
app.use('/order/v1' ,require('./Routes/Order'));
app.use(errorMiddleware)
app.listen(port, () => {
  console.log(`Ecom backend listening on port ${port}`)
})