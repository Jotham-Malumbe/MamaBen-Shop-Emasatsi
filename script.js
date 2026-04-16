// ====================== CONFIGURATION ======================
const SHOP_NAME = "MamaBen's Shop - Emasatsi";
const WHATSAPP_NUMBER = "254115652612";
const ADMIN_PASSWORD = "admin123";

// Delivery Locations
const deliveryLocations = {
    "Emuruba": 50,
    "Eshikwata": 40,
    "Ebutindi": 30,
    "Emulunya": 40,
    "Munjiti": 60,
    "Kilingili": 90,
    "Eshinutsa": 50,
    "Ekonjero": 90,
    "Ebutuku": 50
};

// ====================== GLOBAL VARIABLES ======================
let products = [];
let cart = [];

// Load cart from localStorage on start
function loadCart() {
    const savedCart = localStorage.getItem('mamaBensCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('mamaBensCart', JSON.stringify(cart));
}

// ====================== LOAD PRODUCTS ======================
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = Array.isArray(data) ? data : (data.products || []);
        renderProducts();
        renderCategoryFilters();
    } catch (error) {
        console.error("Failed to load products:", error);
    }
}

// ====================== RENDER PRODUCTS ======================
function renderProducts(filtered = products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    let html = '';
    filtered.forEach(product => {
        html += `
            <div class="product-card cursor-pointer" onclick="viewProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="text-emerald-600 font-bold text-xl">KSh ${product.price}</p>
                    <button onclick="event.stopImmediatePropagation(); addToCart(${product.id});" 
                            class="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-sm font-semibold">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html || '<p class="col-span-full text-center py-20 text-gray-500">No products found</p>';
}

// Category Filters (same as before)
function renderCategoryFilters() {
    const categories = [...new Set(products.map(p => p.category))];
    const container = document.getElementById('category-filters');
    if (!container) return;

    let html = `<button onclick="filterCategory('all')" class="category-btn active">All</button>`;
    categories.forEach(cat => {
        html += `<button onclick="filterCategory('${cat}')" class="category-btn">${cat}</button>`;
    });
    container.innerHTML = html;
}

function filterCategory(category) {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(buttons).find(btn => 
        (category === 'all' && btn.textContent === 'All') || btn.textContent === category
    );
    if (activeBtn) activeBtn.classList.add('active');

    if (category === 'all') renderProducts(products);
    else renderProducts(products.filter(p => p.category === category));
}

// ====================== CART FUNCTIONS ======================
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();           // Save to localStorage
    updateCartCount();
    showToast(`${product.name} added to cart`);
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) renderCart();
}

function renderCart() {
    // ... (same clean cart rendering as previous version)
    // I kept it short here for space, but use the full renderCart from my previous message
}

function changeQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity < 1) item.quantity = 1;
        saveCart();
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartCount();
    renderCart();
}

// Clean WhatsApp Order (same as before - with line breaks)
function placeWhatsAppOrder() {
    if (cart.length === 0) return;

    const option = document.getElementById('delivery-option').value;
    const location = document.getElementById('delivery-location') ? document.getElementById('delivery-location').value : "Pickup";
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const fee = (option === 'delivery') ? (deliveryLocations[location] || 0) : 0;
    const total = subtotal + fee;

    let msg = `Hello MamaBen's Shop,\n\nI want to place an order:\n\n`;

    cart.forEach(item => {
        msg += `• ${item.name} × ${item.quantity} - KSh ${item.price * item.quantity}\n`;
    });

    msg += `\nSubtotal: KSh ${subtotal}\n`;

    if (option === 'delivery') {
        msg += `Delivery Location: ${location}\n`;
        msg += `Delivery Fee: KSh ${fee}\n`;
    } else {
        msg += `Pickup from Shop\n`;
    }

    msg += `\nTotal: KSh ${total}\n\n`;
    msg += `Note: If your location is not listed, delivery fee will be confirmed after order.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    cart = [];
    saveCart();
    updateCartCount();
    toggleCart();

    setTimeout(() => {
        alert("✅ Thank you! Your order has been sent via WhatsApp.");
    }, 800);
}

// Mobile Menu, Theme, Toast, Init (same as previous clean version)
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
}

function setupTheme() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => document.documentElement.classList.toggle('dark'));
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

function init() {
    loadCart();           // Load saved cart
    loadProducts();
    setupMobileMenu();
    setupTheme();
    updateCartCount();
}

window.onload = init;