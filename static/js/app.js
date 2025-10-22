let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadStats();
    loadBooks();
    loadWatchlists();
    loadNotifications();
    initEventListeners();
    initDarkMode();
}

function initEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBooks();
    });
    
    document.getElementById('filterInput').addEventListener('input', (e) => {
        filterBooks(e.target.value);
    });
    
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    document.getElementById('notificationBtn').addEventListener('click', toggleNotificationPanel);
    
    document.getElementById('createWatchlistBtn').addEventListener('click', () => {
        openModal('createWatchlistModal');
    });
    
    document.getElementById('saveWatchlistBtn').addEventListener('click', createWatchlist);
    
    document.getElementById('calculateBtn').addEventListener('click', calculateProfit);
    
    document.getElementById('formatSelect').addEventListener('change', (e) => {
        if (e.target.value === 'ebook') {
            document.getElementById('ebookOptions').style.display = 'block';
            document.getElementById('paperbackOptions').style.display = 'none';
        } else {
            document.getElementById('ebookOptions').style.display = 'none';
            document.getElementById('paperbackOptions').style.display = 'block';
        }
    });
    
    document.getElementById('exportCSV').addEventListener('click', () => {
        window.location.href = '/api/export/csv';
    });
    
    document.getElementById('exportPDF').addEventListener('click', () => {
        window.location.href = '/api/export/pdf';
    });
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            const panel = this.closest('.notification-panel');
            if (modal) modal.style.display = 'none';
            if (panel) panel.classList.remove('open');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'watchlists') {
        loadWatchlists();
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('totalBooks').textContent = data.total_books;
        document.getElementById('avgPrice').textContent = `$${data.avg_price.toFixed(2)}`;
        document.getElementById('avgRating').textContent = data.avg_rating.toFixed(1);
        document.getElementById('notificationBadge').textContent = data.unread_notifications;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        const data = await response.json();
        
        displayBooks(data.books);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

function displayBooks(books) {
    const container = document.getElementById('booksList');
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📖 No books tracked yet</p>
                <p>Start by adding books from the "Add Book" tab</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.id}" data-title="${book.title.toLowerCase()}" data-author="${book.author.toLowerCase()}">
            <div class="book-header">
                ${book.thumbnail_url ? 
                    `<img src="${book.thumbnail_url}" alt="${book.title}" class="book-thumbnail">` :
                    `<div class="book-thumbnail">📚</div>`
                }
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                </div>
            </div>
            
            <div class="book-meta">
                ${book.current_price ? `<span class="price-tag">$${book.current_price.toFixed(2)}</span>` : ''}
                ${book.rating ? `<span class="rating-tag">⭐ ${book.rating.toFixed(1)}</span>` : ''}
                ${book.page_count ? `<span class="meta-item">${book.page_count} pages</span>` : ''}
            </div>
            
            <div class="book-actions">
                <button class="action-btn btn-primary" onclick="viewBookDetails(${book.id})">View Details</button>
                <button class="action-btn btn-danger" onclick="deleteBook(${book.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterBooks(query) {
    const books = document.querySelectorAll('.book-card');
    const lowerQuery = query.toLowerCase();
    
    books.forEach(book => {
        const title = book.dataset.title;
        const author = book.dataset.author;
        
        if (title.includes(lowerQuery) || author.includes(lowerQuery)) {
            book.style.display = 'block';
        } else {
            book.style.display = 'none';
        }
    });
}

async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;
    
    try {
        const response = await fetch('/api/search-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        displaySearchResults(data.books);
    } catch (error) {
        console.error('Error searching books:', error);
        alert('Error searching books. Please try again.');
    } finally {
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    }
}

function displaySearchResults(books) {
    const container = document.getElementById('searchResults');
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="search-result-card">
            <div class="book-header">
                ${book.thumbnail_url ? 
                    `<img src="${book.thumbnail_url}" alt="${book.title}" class="book-thumbnail">` :
                    `<div class="book-thumbnail">📚</div>`
                }
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                </div>
            </div>
            
            <div class="book-meta">
                ${book.price ? `<span class="price-tag">$${book.price.toFixed(2)}</span>` : ''}
                ${book.rating ? `<span class="rating-tag">⭐ ${book.rating.toFixed(1)}</span>` : ''}
                ${book.page_count ? `<span class="meta-item">${book.page_count} pages</span>` : ''}
                ${book.category ? `<span class="meta-item">${book.category}</span>` : ''}
            </div>
            
            <button class="btn btn-primary" style="margin-top: 15px; width: 100%;" onclick='addBook(${JSON.stringify(book)})'>
                Add to Tracker
            </button>
        </div>
    `).join('');
}

async function addBook(bookData) {
    try {
        const response = await fetch('/api/add-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
            alert('Book added successfully!');
            loadBooks();
            loadStats();
        } else {
            const error = await response.json();
            alert(error.error || 'Error adding book');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Error adding book. Please try again.');
    }
}

async function viewBookDetails(bookId) {
    try {
        const response = await fetch(`/api/book/${bookId}`);
        const data = await response.json();
        
        const book = data.book;
        const history = data.history;
        
        const pricingResponse = await fetch(`/api/pricing-suggestion/${bookId}`);
        const pricingData = await pricingResponse.json();
        
        const detailsHTML = `
            <h2>${book.title}</h2>
            <p><strong>Author:</strong> ${book.author}</p>
            ${book.description ? `<p>${book.description.substring(0, 300)}...</p>` : ''}
            
            <div class="detail-section">
                <h3>Current Information</h3>
                <p><strong>Price:</strong> ${book.current_price ? `$${book.current_price.toFixed(2)}` : 'N/A'}</p>
                <p><strong>Rating:</strong> ${book.rating ? `${book.rating.toFixed(1)} ⭐` : 'N/A'}</p>
                <p><strong>Reviews:</strong> ${book.reviews_count || 'N/A'}</p>
                <p><strong>Pages:</strong> ${book.page_count || 'N/A'}</p>
                <p><strong>Category:</strong> ${book.category || 'N/A'}</p>
                <p><strong>Publisher:</strong> ${book.publisher || 'N/A'}</p>
            </div>
            
            <div class="detail-section">
                <h3>AI Pricing Suggestion</h3>
                <div class="suggestion-box">
                    <div class="suggestion-price">$${pricingData.suggested_price}</div>
                    <p><strong>Range:</strong> $${pricingData.min_price} - $${pricingData.max_price}</p>
                    <p><strong>Competitors analyzed:</strong> ${pricingData.analysis.competitor_count}</p>
                    ${pricingData.analysis.avg_competitor_price ? 
                        `<p><strong>Avg competitor price:</strong> $${pricingData.analysis.avg_competitor_price}</p>` : ''}
                    <p><strong>Analysis:</strong> ${pricingData.analysis.reasoning}</p>
                </div>
            </div>
            
            ${history.length > 0 ? `
                <div class="detail-section">
                    <h3>Price & Rating History</h3>
                    <div class="chart-container">
                        <canvas id="historyChart"></canvas>
                    </div>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h3>Update Price/Rating</h3>
                <div class="form-group">
                    <label>New Price ($)</label>
                    <input type="number" id="newPrice" class="form-control" value="${book.current_price || 0}" step="0.01">
                </div>
                <div class="form-group">
                    <label>New Rating</label>
                    <input type="number" id="newRating" class="form-control" value="${book.rating || 0}" step="0.1" min="0" max="5">
                </div>
                <button class="btn btn-primary" onclick="updateBookPrice(${bookId})">Update</button>
            </div>
        `;
        
        document.getElementById('bookDetails').innerHTML = detailsHTML;
        document.getElementById('bookModal').style.display = 'block';
        
        if (history.length > 0) {
            setTimeout(() => renderHistoryChart(history), 100);
        }
    } catch (error) {
        console.error('Error loading book details:', error);
        alert('Error loading book details');
    }
}

function renderHistoryChart(history) {
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const labels = history.map(h => new Date(h.snapshot_date).toLocaleDateString());
    const prices = history.map(h => h.price || 0);
    const ratings = history.map(h => (h.rating || 0) * 2);
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Price ($)',
                    data: prices,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Rating (scaled x2)',
                    data: ratings,
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Rating (scaled)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

async function updateBookPrice(bookId) {
    const newPrice = parseFloat(document.getElementById('newPrice').value);
    const newRating = parseFloat(document.getElementById('newRating').value);
    
    try {
        const response = await fetch(`/api/update-price/${bookId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                price: newPrice, 
                rating: newRating 
            })
        });
        
        if (response.ok) {
            alert('Price updated successfully!');
            document.getElementById('bookModal').style.display = 'none';
            loadBooks();
            loadStats();
            loadNotifications();
        } else {
            alert('Error updating price');
        }
    } catch (error) {
        console.error('Error updating price:', error);
        alert('Error updating price');
    }
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
        const response = await fetch(`/api/book/${bookId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadBooks();
            loadStats();
        } else {
            alert('Error deleting book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error deleting book');
    }
}

async function loadWatchlists() {
    try {
        const response = await fetch('/api/watchlists');
        const data = await response.json();
        
        displayWatchlists(data.watchlists);
    } catch (error) {
        console.error('Error loading watchlists:', error);
    }
}

function displayWatchlists(watchlists) {
    const container = document.getElementById('watchlistsList');
    
    if (watchlists.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📋 No watchlists created yet</p>
                <p>Create a watchlist to organize your books</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = watchlists.map(watchlist => `
        <div class="watchlist-card" onclick="viewWatchlist(${watchlist.id})">
            <div class="watchlist-name">${watchlist.name}</div>
            <div class="watchlist-count">${watchlist.book_count} books</div>
            ${watchlist.description ? `<p style="margin-top: 10px; color: var(--text-secondary);">${watchlist.description}</p>` : ''}
        </div>
    `).join('');
}

async function createWatchlist() {
    const name = document.getElementById('watchlistName').value.trim();
    const description = document.getElementById('watchlistDescription').value.trim();
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    try {
        const response = await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        
        if (response.ok) {
            document.getElementById('watchlistName').value = '';
            document.getElementById('watchlistDescription').value = '';
            document.getElementById('createWatchlistModal').style.display = 'none';
            loadWatchlists();
        } else {
            const error = await response.json();
            alert(error.error || 'Error creating watchlist');
        }
    } catch (error) {
        console.error('Error creating watchlist:', error);
        alert('Error creating watchlist');
    }
}

async function viewWatchlist(watchlistId) {
    try {
        const response = await fetch(`/api/watchlist/${watchlistId}/books`);
        const data = await response.json();
        
        alert(`Watchlist contains ${data.books.length} books. Full watchlist view coming soon!`);
    } catch (error) {
        console.error('Error loading watchlist:', error);
    }
}

async function calculateProfit() {
    const format = document.getElementById('formatSelect').value;
    const price = parseFloat(document.getElementById('priceInput').value);
    
    const requestData = { format, price };
    
    if (format === 'ebook') {
        requestData.file_size = parseFloat(document.getElementById('fileSizeInput').value);
    } else {
        requestData.printing_cost = parseFloat(document.getElementById('printCostInput').value);
    }
    
    try {
        const response = await fetch('/api/profit-calculator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayProfitResults(data);
        } else {
            alert(data.error || 'Error calculating profit');
        }
    } catch (error) {
        console.error('Error calculating profit:', error);
        alert('Error calculating profit');
    }
}

function displayProfitResults(data) {
    const container = document.getElementById('profitResults');
    
    container.innerHTML = `
        <h3>Profit Calculation Results</h3>
        <div class="profit-item">
            <span class="profit-label">Profit per Sale:</span>
            <span class="profit-value" style="font-size: 1.5rem;">$${data.profit_per_sale.toFixed(2)}</span>
        </div>
        <div class="profit-item">
            <span class="profit-label">Royalty Rate:</span>
            <span class="profit-value">${data.royalty_rate}%</span>
        </div>
        ${data.delivery_cost !== undefined ? `
            <div class="profit-item">
                <span class="profit-label">Delivery Cost:</span>
                <span class="profit-value">$${data.delivery_cost.toFixed(2)}</span>
            </div>
        ` : ''}
        ${data.printing_cost !== undefined ? `
            <div class="profit-item">
                <span class="profit-label">Printing Cost:</span>
                <span class="profit-value">$${data.printing_cost.toFixed(2)}</span>
            </div>
        ` : ''}
        <div class="profit-item">
            <span class="profit-label">Recommended Range:</span>
            <span class="profit-value">$${data.recommended_range.min} - $${data.recommended_range.max}</span>
        </div>
        <p style="margin-top: 15px; color: var(--text-secondary);">
            ${data.recommended_range.reason}
        </p>
    `;
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        displayNotifications(data.notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notifications</p></div>';
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
            <div class="notification-message">${notif.message}</div>
            <div class="notification-meta">
                ${notif.title} by ${notif.author} - ${new Date(notif.created_date).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        loadNotifications();
        loadStats();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function toggleNotificationPanel() {
    document.getElementById('notificationPanel').classList.toggle('open');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
}

function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}
