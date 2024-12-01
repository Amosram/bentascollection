import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import stripe from 'stripe';
import multer from 'multer';
import { LocalStorage } from 'node-localstorage';

const __dirname = path.resolve();

//creating the app
const app = express(); 
const port = 5000;
const jwtSecretKey = "benta'scollection456tgd";
const stripeGateway = stripe("sk_test_51Pr6ba2LDzz6FUjZ98Yrz41P44L2aO5pEAXBwyxlEwJNmgIQs9fnD9CYG7cwto5o3QGzTAJLOmUceNSVl4A2hevk00BtTUgK5G");
const DOMAIN = 'http://localhost:5000';
const localStorage = new LocalStorage('./desktop');

// Middlewares 
app.use(bodyParser.json()); 

//creating token for user
const createToken = (id) => {
    return jwt.sign({id}, jwtSecretKey);
}

// Middleware to serve static files 
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT tokens 
const authenticateToken = (req, res, next) => { 
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1]; 
    if (!token) return res.status(401).send({ message: 'Access denied. Token has not been provided.' }); 
    jwt.verify(token, jwtSecretKey, (err, user) => { 
        if (err) return res.status(403).send({ message: 'Invalid token.' }); 
        req.user = user; // Store user info in the request object 
        next(); 
    });
};


// MongoDB connection 
const uri = 'mongodb+srv://amosrama733:QuNzvOVdB755UuSs@cluster0.32fbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';


const connectDB = async () => {
    try {
       await mongoose.connect(uri);
        console.log("Database Connected");
    } catch (error) {
        console.log(error)
    }
}

//OUR MODELS HERE
// Definining user schema and model 
const userSchema = new mongoose.Schema({ 
    firstName: {type: String, required: true}, 
    lastName: {type: String, required: true}, 
    email: {type: String, required: true}, 
    password: {type: String, required: true}, 
    isAdmin: {type: Boolean, default: false},
}); 
const User = mongoose.model('User', userSchema);

const ProductSchema = new mongoose.Schema({ 
    title: { type: String, required: true }, 
    price: { type: Number, required: true },
    image: { type: String } // Here is the imageUrl field 
});
const Product = mongoose.models.product ||  mongoose.model('product', ProductSchema);

//END OF MODELS

//admin middleware
const admin = (req, res, next) => { 
    if (!req.user.isAdmin) { 
        return res.status(403).json({ message: 'Access denied: Only Admins can add products' }); 
    } next();
}


//OUR ENDPOINTS HERE
// Fetch all products 
app.get('/all-products', async (req, res) => { 
    try {
        const products = await Product.find(); 
        res.json(products); 
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
});

//setting up multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Save files to 'public/uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Save with timestamp for unique filename
    }
});
const upload = multer({ storage: storage });


// Add a new product 
app.post('/add-products', upload.single('image'),async (req, res) => { 
   
    try {
        const {title, price} = req.body;
        const image = `/uploads/${req.file.filename}`; // Get image URL

        const productData = {
            title,
            price:Number(price),
            image:image,
        }

        const newProduct = new Product(productData); 
        await newProduct.save(); 
        res.json({success:true, message:"Product added Successifully"}); 

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
});

// Delete a product 
app.delete('/remove-products', async (req, res) => { 
    try {
        await Product.findByIdAndDelete(req.body.id); 
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
  
});

// User registration endpoint 
app.post('/api/register', async (req, res) => { 
    const { firstName, lastName, email, password } = req.body; 
    try {
        const hashedPassword = await bcrypt.hash(password, 10); 
        const newUser = new User({ 
            firstName,
            lastName,
            email,
            password: hashedPassword 
        }); 

        const user = await newUser.save();
        const token = createToken(user._id);
        res.status(200).send({success:true, token, message:"User registered successifully", redirectUrl:"/index.html"}); 
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
});

// User login endpoint 
app.post('/api/login', async (req, res) => { 
    const { email, password } = req.body; 
    try {
        const user = await User.findOne({email}); 
        if (!user) { 
            return res.status(401).send({ message: 'User does not Exist' }); 
        } 

        const isMatch = await bcrypt.compare(password, user.password)

        
        if (isMatch) {
            const token = createToken(user._id);
            res.status(200).send({success:true, message: 'Login successful!', token, username: user.firstName, redirectUrl:"/index.html" }); 
            localStorage.setItem("token",token);
            localStorage.setItem("username",user.firstName);
        } else {
            res.json({success:false, message:"Invalid credentials"})
        }
       
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"})
    }
   
});

//stripe endpoint
app.post('/stripe-payment', async (req, res) => {
    const lineItems = req.body.items.map((item) => {
        const unitAmount = (item.price) * 100;
        console.log('item-price:', item.price);
        console.log('unitAmout:', unitAmount);
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: [item.image],
                },  
                unit_amount:unitAmount,
            },
            quantity: 1,
        };
    });
    console.log("lineItems:", lineItems);

    //here were creating checkout session
    const session = await stripeGateway.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url:`${DOMAIN}/success`,
        cancel_url: `${DOMAIN}/cancel`,
        line_items: lineItems,

        //here we ask for address on checkout
        billing_address_collection: "required"  
    });

    res.json(session.url);
})

// Route for the homepage 
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Route for success page
app.get('/success', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

//Route foe cancel pagae
app.get('/cancel', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});
//END OF ENDPOINTS

//running the server on port 5000
app.listen(port, () => { 
    connectDB();
    console.log(`Server running at http://localhost:${port}`); 
});