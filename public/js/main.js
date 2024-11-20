//toggle sidebar
document.getElementById("menu-icon").onclick = () => {
    document.getElementById("navmenu").classList.toggle("active");
}

//toggle register page
document.getElementById("register-btn").onclick = () => {
    document.getElementById("register").classList.toggle("active");
    document.getElementById("main-header").style.display = "none";
}

//toggle login page
document.getElementById("login-btn").onclick = () => {
    document.getElementById("login").classList.toggle("active");
    document.getElementById("main-header").style.display = "none";
}

//toggle dashboard page
document.getElementById("dashboard-btn").onclick = () => {
    document.getElementById("dashboard").classList.toggle("active");
    document.getElementById("main-header").style.display = "none";
}


//toggle cart
let bxCart = document.querySelector(".bx-cart");
let cartContainer = document.querySelector(".cart-container");

bxCart.onclick = () => {
    cartContainer.classList.toggle("active");
}

document.getElementById("close-btn").onclick = () => {
    cartContainer.classList.remove("active");
}



//function to add product api
const addProduct = document.getElementById('add-product');
addProduct.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;

    fetch('/add-products', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, price}),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});




const products = [
    {
        id: 1,
        title: "Dress",
        price:1240,
        image:"/images/image-3.jpg"
    },
    {
        id: 2,
        title: "Dress",
        price:1240,
        image:"/images/image-3.jpg"
    },
    {
        id: 3,
        title: "Dress",
        price:1240,
        image:"/images/image-3.jpg"
    },
    {
        id: 4,
        title: "Dress",
        price:1240,
        image:"/images/image-3.jpg"
    },
    {
        id: 5,
        title: "Dress",
        price:1240,
        image:"/images/image-3.jpg"
    },
];

let clothes = [...new Set(products.map((item) => 
    {return item}))]
    let i = 0;



document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('products').innerHTML = clothes.map((item) => 
        {
            var {image, title, price} = item;
            return (
                `<div class="box">
                    <div class="image-box">
                        <img class="images" src=${image}></img>
                    </div>
                    <div class="bottom">
                        <p>${title}
                            <i id="heart" class='bx bx-heart'></i>
                        </p>
                        <h2>KSH ${price}.00</h2>`+
                        "<button class='add-to-cart-btn' onclick='addToCart("+(i++)+")'>Add To Cart</button>" +
                    `</div>
                </div>
                `
            )
          
        }).join('')
});

const cart = [];
function addToCart(a) {
    cart.push({...products[a]});
    displaycart();
    localStorage.setItem('cart', JSON.stringify(cart));
}

//function to remove item from cart
function delElement(a) {
    cart.splice(a, 1);
    displaycart();
}

//function to display cart
function displaycart(a) {
    let j = 0, total = 0;
    const quantity = document.getElementById("count").innerHTML = cart.length;
    if (cart.length == 0) {
        document.getElementById('cartItems').innerHTML = "Your Cart is Empty";
        document.getElementById('totalPrice').innerHTML = "KSH " + 0 + ".00";
    } else {
        document.getElementById('cartItems').innerHTML = cart.map((items) => {
            var {image, title, price, quantity} = items;
            total = total + price;
            document.getElementById('totalPrice').innerHTML = "KSH " + total + ".00";
            return (
                `<div class="cart-item">
                    <div class="row-img">
                        <img class="image-row" src=${image}></img>
                    </div>
                    <p>${title}</p>
                    <h2>ksh ${price}.00</h2>`+
                    "<i class='bx bx-trash' onclick='delElement("+(j++) +")'></i>" +`
                </div>
                `
            )
        }).join('');
    }
}

//function to fetch rigistration api
const formSignUp = document.getElementById('signupMessage');
formSignUp.addEventListener('submit', function(e) {
    e.preventDefault();
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;

    fetch('/api/register', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl; // Redirecting to the login page
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

//function to fetch login api
const formSignIn =  document.getElementById('signinMessage');
formSignIn.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
         if (data.token) { 
            localStorage.setItem('token', data.token); // Store the JWT token in localstorage
            localStorage.setItem('username', data.email); // Store the username in localStorage 
            window.location.href = data.redirectUrl; // Redirect to the homepage
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


// On page load, display the username if the user is logged in 
document.addEventListener('DOMContentLoaded', function() {
    const registerBtn = document.getElementById("register-btn");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const dashboardBtn = document.getElementById("dashboard-btn");
    
    const username = localStorage.getItem('username'); 
    const token = localStorage.getItem('token');
    
    if (token && username) {
        registerBtn.style.display = "none";
        loginBtn.style.display = "none";
        loginBtn.style.display = "none";
        dashboardBtn.style.display = "block";
        logoutBtn.style.display = "block";
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('token');
        registerBtn.style.display = "block";
        loginBtn.style.display = "block";
        dashboardBtn.style.display = "none";
        logoutBtn.style.display = "none";
    })
});

//checkout functionality to fetch stripe api from server 
const btnPay = document.getElementById("btn-pay");

btnPay.addEventListener("click", () => {
    fetch('/stripecheckout', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items:JSON.parse(localStorage.getItem('cart')),
         }),
    })
    .then((res) => res.json())
    .then((url) => {
        location.href = url;
    })
    .catch((err) => console.log(err));
})

