import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import stripe from 'stripe';
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
mongoose.connect(uri,{
     useNewUrlParser: true, 
     useUnifiedTopology: true,
     //QuNzvOVdB755UuSs
});

//OUR MODELS HERE
// Definining user schema and model 
const userSchema = new mongoose.Schema({ 
    firstName: String, 
    lastName: String, 
    email: String, 
    password: String, 
}); 
const User = mongoose.model('User', userSchema);

//END OF MODELS


//OUR ENDPOINTS HERE
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
        const unitAmount = parseInt(parseFloat(item.price) * 100);
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
    console.log(`Server running at http://localhost:${port}`); 
});