document.addEventListener("DOMContentLoaded", () => {
    fetch('/all-products')
        .then(response => response.json())
        .then(products => {
            let clothes = [...new Set(products.map((item) => 
                {return item}))]
                let i = 0;
            displayProducts(clothes);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        }); 
});



function displayProducts(clothes) {
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = ''; // Clear existing products
    clothes.forEach(product => {
        let i = 0;
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');
        productDiv.innerHTML = `
            <div class="box">
                <div class="bottom">
                    <p>${product.title}
                        <i id="heart" class='bx bx-heart'></i>
                    </p>
                    <h2>KSH ${product.price}.00</h2>`+
                    "<button class='add-to-cart-btn' onclick='addToCart("+(i++)+")'>Add To Cart</button>" +
                   `</div>
            </div>
            `;
        productsDiv.appendChild(productDiv);
    });
}
