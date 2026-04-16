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

// Load products from localStorage or products.json
async function loadProducts() {
    // Try localStorage first (from Admin Panel)
    const savedProducts = localStorage.getItem('mamaBensProducts');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        // Fallback to products.json
        try {
            const response = await fetch('products.json');
            const data = await response.json();
            products = Array.isArray(data) ? data : (data.products || []);
            localStorage.setItem('mamaBensProducts', JSON.stringify(products));
        } catch (error) {
            console.error("Failed to load products.json", error);
            products = [];
        }
    }
    renderProducts();
    renderCategoryFilters();
}

// Render products on homepage
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

// Category Filters
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

    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart`);
}

function saveCart() {
    localStorage.setItem('mamaBensCart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('mamaBensCart');
    if (saved) cart = JSON.parse(saved);
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
    const container = document.getElementById('cart-modal').querySelector('div');
    if (!container) return;

    let subtotal = 0;
    let html = `
        <div class="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
            <h2 class="text-2xl font-bold">Your Cart</h2>
            <button onclick="toggleCart()" class="text-4xl leading-none text-gray-400">×</button>
        </div>
        <div class="p-6 max-h-[55vh] overflow-y-auto">`;

    if (cart.length === 0) {
        html += `<p class="text-center py-16 text-gray-500">Your cart is empty</p>`;
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            html += `
                <div class="flex gap-4 py-6 border-b dark:border-slate-700">
                    <img src="${item.image}" class="w-20 h-20 object-cover rounded-2xl">
                    <div class="flex-1">
                        <p class="font-semibold">${item.name}</p>
                        <p class="text-emerald-600">KSh ${item.price} × ${item.quantity}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold">KSh ${itemTotal}</p>
                        <div class="flex gap-3 mt-3">
                            <button onclick="changeQuantity(${item.id}, -1)" class="w-8 h-8 border rounded-xl">-</button>
                            <span class="w-8 text-center font-medium">${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)" class="w-8 h-8 border rounded-xl">+</button>
                            <button onclick="removeFromCart(${item.id})" class="ml-4 text-red-500 text-sm">Remove</button>
                        </div>
                    </div>
                </div>`;
        });
    }

    html += `</div>`;

    html += `
        <div class="p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <div class="space-y-4 mb-6">
                <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span class="font-semibold">KSh ${subtotal}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>Delivery</span>
                    <select id="delivery-option" onchange="updateDeliveryFee()" class="bg-transparent border rounded-xl px-4 py-2">
                        <option value="pickup">Pickup (Free)</option>
                        <option value="delivery">Delivery</option>
                    </select>
                </div>
                <div id="location-group" class="hidden flex justify-between items-center">
                    <span>Location</span>
                    <select id="delivery-location" onchange="updateDeliveryFee()" class="bg-transparent border rounded-xl px-4 py-2">
                        ${Object.entries(deliveryLocations).map(([loc, fee]) => 
                            `<option value="${loc}">${loc} - KSh ${fee}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="flex justify-between text-xl font-bold pt-4 border-t dark:border-slate-600">
                    <span>Total</span>
                    <span id="grand-total" class="text-emerald-600">KSh ${subtotal}</span>
                </div>
            </div>

            <button onclick="placeWhatsAppOrder()" 
                    class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl text-lg font-semibold">
                Order via WhatsApp
            </button>
        </div>`;

    container.innerHTML = html;
    updateDeliveryFee();
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

function updateDeliveryFee() {
    const option = document.getElementById('delivery-option').value;
    const group = document.getElementById('location-group');
    let fee = 0;

    if (option === 'delivery') {
        group.classList.remove('hidden');
        const loc = document.getElementById('delivery-location').value;
        fee = deliveryLocations[loc] || 0;
    } else {
        group.classList.add('hidden');
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('grand-total').textContent = `KSh ${subtotal + fee}`;
}

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

// ====================== MOBILE MENU & THEME ======================
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

// ====================== INIT ======================
function init() {
    loadCart();
    loadProducts();
    setupMobileMenu();
    setupTheme();
    updateCartCount();
}

window.onload = init;
