let cart = [];
let totalAmount = 0;

// Cart Toggle Functionality
document.getElementById('cart-icon').addEventListener('click', toggleCart);

function toggleCart() {
    const cartSection = document.getElementById('Cart');
    cartSection.classList.toggle('show');
}

// Add to Cart Functionality
document.querySelectorAll('.menu_btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.menu_card');
        const itemName = card.querySelector('h2').textContent;
        const itemPrice = card.querySelector('h3').textContent.replace('₹', '');
        
        addToCart(itemName, itemPrice);
    });
});

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if(existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: name,
            price: parseFloat(price),
            quantity: 1
        });
    }
    updateCart();
}

// Update Cart Display
function updateCart() {
    const cartItems = document.querySelector('.cart_items');
    const cartTotal = document.getElementById('cart_total_amount');
    const cartCount = document.getElementById('cart-count');

    // Clear existing items
    cartItems.innerHTML = '';
    totalAmount = 0;

    // Populate cart items
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart_item';
        itemElement.innerHTML = `
            <p>${item.name} (${item.quantity}x)</p>
            <p>₹${(item.price * item.quantity).toFixed(2)}</p>
            <div class="quantity-controls">
                <button onclick="changeQuantity(${index}, 'decrease')">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 'increase')">+</button>
            </div>
            <button onclick="removeItem(${index})" class="remove-btn">Remove</button>
        `;
        cartItems.appendChild(itemElement);
        totalAmount += item.price * item.quantity;
    });

    // Update totals
    cartTotal.textContent = totalAmount.toFixed(2);
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Quantity Modification Functions
function changeQuantity(index, operation) {
    if(operation === 'increase') {
        cart[index].quantity++;
    } else if(operation === 'decrease' && cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }
    updateCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Payment Modal Handling
document.querySelector('.cart_checkout_btn').addEventListener('click', openPaymentModal);

function openPaymentModal() {
    if(cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'block';
    generateBill();
}

function generateBill() {
    const billDetails = document.getElementById('billDetails');
    billDetails.innerHTML = '';
    
    cart.forEach(item => {
        const billItem = document.createElement('div');
        billItem.className = 'bill-item';
        billItem.innerHTML = `
            <p>${item.name} (${item.quantity}x) - ₹${item.price.toFixed(2)}</p>
            <p>₹${(item.price * item.quantity).toFixed(2)}</p>
        `;
        billDetails.appendChild(billItem);
    });
}

// Receipt Generation
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    generateReceipt(name, address, paymentMethod);
    closePaymentModal();
});

function generateReceipt(name, address, paymentMethod) {
    const receiptModal = document.getElementById('receiptModal');
    const receiptDate = new Date().toLocaleString();
    
    // Populate customer info
    document.getElementById('receipt-name').textContent = `Name: ${name}`;
    document.getElementById('receipt-address').textContent = `Address: ${address}`;
    document.getElementById('receipt-date').textContent = `Date: ${receiptDate}`;
    document.getElementById('receipt-payment-method').textContent = paymentMethod;

    // Populate items
    const receiptItems = document.querySelector('#receipt-items tbody');
    receiptItems.innerHTML = '';
    
    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${(item.price * item.quantity).toFixed(2)}</td>
        `;
        receiptItems.appendChild(row);
    });

    // Update total
    document.getElementById('receipt-total-amount').textContent = totalAmount.toFixed(2);
    
    // Show receipt modal
    receiptModal.style.display = 'block';
    
    // Clear cart
    cart = [];
    updateCart();
}

// Modal Close Functionality
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Print Receipt
function printReceipt() {
    window.print();
}

// Close Receipt
function closeReceipt() {
    document.getElementById('receiptModal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    if(event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

