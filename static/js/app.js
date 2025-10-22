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
    loadSampleBooks();
}

async function loadSampleBooks() {
    const sampleBooks = [
        {
            isbn: '9780544003415',
            title: 'The Lord of the Rings',
            author: 'J.R.R. Tolkien',
            price: 14.99,
            rating: 4.8,
            reviews_count: 25000,
            page_count: 1178,
            category: 'Fantasy, Fiction',
            publisher: 'Mariner Books',
            published_date: '2012-09-18',
            description: 'One Ring to rule them all... The dark, fearsome Ringwraiths are searching for a Hobbit. Frodo Baggins knows they are seeking him and the Ring he bears—the Ring of Power that would enable Sauron to destroy all that is good in Middle-earth.',
            thumbnail_url: 'https://books.google.com/books/content?id=aWZzLPhY4o0C&printsec=frontcover&img=1&zoom=1'
        },
        {
            isbn: '9780062024039',
            title: 'Unbroken',
            author: 'Laura Hillenbrand',
            price: 9.99,
            rating: 4.7,
            reviews_count: 18500,
            page_count: 473,
            category: 'Biography, History',
            publisher: 'Random House',
            published_date: '2010-11-16',
            description: 'In boyhood, Louis Zamperini was an incorrigible delinquent. As a teenager, he channeled his defiance into running, discovering a prodigious talent that had carried him to the Berlin Olympics. But when World War II began, the athlete became an airman.',
            thumbnail_url: 'https://books.google.com/books/content?id=2bJkBAAAQBAJ&printsec=frontcover&img=1&zoom=1'
        },
        {
            isbn: '9780316769174',
            title: 'The Catcher in the Rye',
            author: 'J.D. Salinger',
            price: 7.99,
            rating: 3.8,
            reviews_count: 12000,
            page_count: 234,
            category: 'Fiction, Classic',
            publisher: 'Little, Brown and Company',
            published_date: '1991-05-01',
            description: 'The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield. Through circumstances that tend to preclude adult, secondhand description, he leaves his prep school in Pennsylvania and goes underground in New York City for three days.',
            thumbnail_url: 'https://books.google.com/books/content?id=PCDengEACAAJ&printsec=frontcover&img=1&zoom=1'
        },
        {
            isbn: '9780061120084',
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            price: 8.99,
            rating: 4.8,
            reviews_count: 32000,
            page_count: 324,
            category: 'Fiction, Classic',
            publisher: 'Harper Perennial Modern Classics',
            published_date: '2006-05-23',
            description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. "To Kill A Mockingbird" became both an instant bestseller and a critical success when it was first published in 1960.',
            thumbnail_url: 'https://books.google.com/books/content?id=PGR2AwAAQBAJ&printsec=frontcover&img=1&zoom=1'
        },
        {
            isbn: '9780547928227',
            title: '1984',
            author: 'George Orwell',
            price: 12.99,
            rating: 4.6,
            reviews_count: 28000,
            page_count: 328,
            category: 'Fiction, Science Fiction, Dystopian',
            publisher: 'Mariner Books',
            published_date: '2013-01-01',
            description: 'Written in 1948, 1984 was George Orwell\'s chilling prophecy about the future. And while 1984 has come and gone, his dystopian vision of a government that will do anything to control the narrative is timelier than ever.',
            thumbnail_url: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1'
        }
    ];

    // Check if books already exist
    try {
        const response = await fetch('/api/books');
        const data = await response.json();

        if (data.books.length === 0) {
            // Add sample books
            for (const book of sampleBooks) {
                await fetch('/api/add-book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(book)
                });
            }
            console.log('Sample books added successfully');
            loadBooks();
            loadStats();
        }
    } catch (error) {
        console.error('Error loading sample books:', error);
    }
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

function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab).classList.add('active');
        });
    });

    // Search functionality
    document.getElementById('searchBtn')?.addEventListener('click', searchBooks);
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBooks();
    });

    // Book filter
    document.getElementById('filterInput')?.addEventListener('input', filterBooks);

    // Profit calculator
    document.getElementById('calculateBtn')?.addEventListener('click', calculateProfit);
    document.getElementById('formatSelect')?.addEventListener('change', (e) => {
        const format = e.target.value;
        const ebookOptions = document.getElementById('ebookOptions');
        const paperbackOptions = document.getElementById('paperbackOptions');
        const hardcoverOptions = document.getElementById('hardcoverOptions');

        if (format === 'ebook') {
            ebookOptions.style.display = 'block';
            if (paperbackOptions) paperbackOptions.style.display = 'none';
            if (hardcoverOptions) hardcoverOptions.style.display = 'none';
        } else if (format === 'paperback') {
            ebookOptions.style.display = 'none';
            if (paperbackOptions) paperbackOptions.style.display = 'block';
            if (hardcoverOptions) hardcoverOptions.style.display = 'none';
            document.getElementById('printCostInput').value = '3.00';
        } else if (format === 'hardcover') {
            ebookOptions.style.display = 'none';
            if (paperbackOptions) paperbackOptions.style.display = 'none';
            if (hardcoverOptions) hardcoverOptions.style.display = 'block';
            document.getElementById('hardcoverCostInput').value = '5.50';
        }
    });

    // Export
    document.getElementById('exportCSV')?.addEventListener('click', () => {
        window.location.href = '/api/export/csv';
    });
    document.getElementById('exportPDF')?.addEventListener('click', () => {
        window.location.href = '/api/export/pdf';
    });

    // Watchlist
    document.getElementById('createWatchlistBtn')?.addEventListener('click', () => {
        document.getElementById('createWatchlistModal').style.display = 'block';
    });
    document.getElementById('saveWatchlistBtn')?.addEventListener('click', createWatchlist);

    // Notifications
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
        const panel = document.getElementById('notificationPanel');
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });

    // Dark mode
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    document.querySelectorAll('.notification-panel .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.getElementById('notificationPanel').style.display = 'none';
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
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

        // Get watchlist info
        const watchlistsResponse = await fetch('/api/watchlists');
        const watchlistsData = await watchlistsResponse.json();
        const watchlist = watchlistsData.watchlists.find(w => w.id === watchlistId);

        const watchlistHTML = `
            <h2>${watchlist.name}</h2>
            ${watchlist.description ? `<p class="watchlist-description">${watchlist.description}</p>` : ''}
            <p class="watchlist-book-count">${data.books.length} books in this watchlist</p>
            
            ${data.books.length === 0 ? `
                <div class="empty-state" style="margin-top: 30px;">
                    <p>📚 No books in this watchlist yet</p>
                    <p>Add books from your tracked books to organize them here</p>
                </div>
            ` : `
                <div class="watchlist-books-grid">
                    ${data.books.map(book => `
                        <div class="book-card" data-book-id="${book.id}">
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
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewBookDetails(${book.id})">View Details</button>
                                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); removeFromWatchlist(${watchlistId}, ${book.id})">Remove</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        document.getElementById('bookDetails').innerHTML = watchlistHTML;
        document.getElementById('bookModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading watchlist:', error);
        showToast('Error loading watchlist', 'error');
    }
}

async function removeFromWatchlist(watchlistId, bookId) {
    const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
    if (!bookCard) return;

    // Check if confirmation already exists
    if (bookCard.querySelector('.delete-confirmation')) return;

    // Create inline confirmation
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'inline-message inline-message-warning show delete-confirmation';
    confirmationDiv.innerHTML = `
        <span>Remove this book from watchlist?</span>
        <div style="display: flex; gap: 10px; margin-left: auto;">
            <button class="btn btn-danger btn-sm" onclick="confirmRemoveFromWatchlist(${watchlistId}, ${bookId})">Remove</button>
            <button class="btn btn-secondary btn-sm" onclick="cancelRemoveFromWatchlist(${bookId})">Cancel</button>
        </div>
    `;

    // Insert before book actions
    const bookActions = bookCard.querySelector('.book-actions');
    bookCard.insertBefore(confirmationDiv, bookActions);
}

async function confirmRemoveFromWatchlist(watchlistId, bookId) {
    try {
        await fetch(`/api/watchlist/${watchlistId}/remove-book/${bookId}`, { method: 'DELETE' });
        showToast('Book removed from watchlist', 'success');
        // Reload the watchlist view
        viewWatchlist(watchlistId);
    } catch (error) {
        console.error('Error removing book from watchlist:', error);
        showToast('Error removing book from watchlist', 'error');
    }
}

function cancelRemoveFromWatchlist(bookId) {
    const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
    if (!bookCard) return;

    const confirmation = bookCard.querySelector('.delete-confirmation');
    if (confirmation) {
        confirmation.remove();
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

        const booksList = document.getElementById('booksList');

        if (data.books.length === 0) {
            booksList.innerHTML = `
                <div class="empty-state">
                    <p>📖 No books tracked yet</p>
                    <p>Start by adding books from the "Add Book" tab</p>
                </div>
            `;
            return;
        }

        booksList.innerHTML = data.books.map(book => `
            <div class="book-card" onclick="viewBookDetails(${book.id})">
                <div class="book-header">
                    ${book.thumbnail_url ? `<img src="${book.thumbnail_url}" alt="${book.title}" class="book-thumbnail">` : '<div class="book-thumbnail"></div>'}
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                    </div>
                </div>
                <div class="book-meta">
                    ${book.current_price ? `<span class="price-tag">$${book.current_price.toFixed(2)}</span>` : ''}
                    ${book.rating ? `<span class="rating-tag">⭐ ${book.rating.toFixed(1)}</span>` : ''}
                    ${book.page_count ? `<span class="meta-item">${book.page_count} pages</span>` : ''}
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); getPricingSuggestion(${book.id})">💡 Price Suggestion</button>
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); deleteBook(${book.id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert('Please enter a search term');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p>Searching...</p>';

    try {
        const response = await fetch('/api/search-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (data.books.length === 0) {
            searchResults.innerHTML = '<p>No books found</p>';
            return;
        }

        searchResults.innerHTML = data.books.map(book => `
            <div class="book-card">
                <div class="book-header">
                    ${book.thumbnail_url ? `<img src="${book.thumbnail_url}" alt="${book.title}" class="book-thumbnail">` : '<div class="book-thumbnail"></div>'}
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                    </div>
                </div>
                <div class="book-meta">
                    ${book.price ? `<span class="price-tag">$${book.price.toFixed(2)}</span>` : ''}
                    ${book.rating ? `<span class="rating-tag">⭐ ${book.rating.toFixed(1)}</span>` : ''}
                    ${book.page_count ? `<span class="meta-item">${book.page_count} pages</span>` : ''}
                    ${book.category ? `<span class="meta-item">${book.category}</span>` : ''}
                </div>
                <button class="btn btn-primary" onclick='addBook(${JSON.stringify(book)})'>+ Add to Tracker</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching books:', error);
        searchResults.innerHTML = '<p>Error searching books</p>';
    }
}

function filterBooks() {
    const filter = document.getElementById('filterInput').value.toLowerCase();
    const bookCards = document.querySelectorAll('#booksList .book-card');

    bookCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(filter) ? 'block' : 'none';
    });
}

async function calculateProfit() {
    const format = document.getElementById('formatSelect').value;
    const price = parseFloat(document.getElementById('priceInput').value);

    const data = { price, format };

    if (format === 'ebook') {
        data.file_size = parseFloat(document.getElementById('fileSizeInput').value);
    } else if (format === 'paperback') {
        data.printing_cost = parseFloat(document.getElementById('printCostInput').value);
    } else if (format === 'hardcover') {
        data.printing_cost = parseFloat(document.getElementById('hardcoverCostInput').value);
    }

    try {
        const response = await fetch('/api/profit-calculator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            const resultsDiv = document.getElementById('profitResults');
            resultsDiv.innerHTML = `
                <h3>Profit Analysis</h3>
                <div class="profit-card">
                    <p><strong>Profit Per Sale:</strong> $${result.profit_per_sale.toFixed(2)}</p>
                    <p><strong>Royalty Rate:</strong> ${result.royalty_rate}%</p>
                    ${result.delivery_cost ? `<p><strong>Delivery Cost:</strong> $${result.delivery_cost.toFixed(2)}</p>` : ''}
                    ${result.printing_cost ? `<p><strong>Printing Cost:</strong> $${result.printing_cost.toFixed(2)}</p>` : ''}
                    <hr>
                    <p><strong>Recommended Price Range:</strong></p>
                    <p>$${result.recommended_range.min} - $${result.recommended_range.max}</p>
                    <p><em>${result.recommended_range.reason}</em></p>
                </div>
            `;
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error calculating profit:', error);
        alert('Error calculating profit');
    }
}

async function loadWatchlists() {
    try {
        const response = await fetch('/api/watchlists');
        const data = await response.json();

        const watchlistsList = document.getElementById('watchlistsList');

        if (data.watchlists.length === 0) {
            watchlistsList.innerHTML = '<p>No watchlists yet. Create one to organize your books!</p>';
            return;
        }

        watchlistsList.innerHTML = data.watchlists.map(wl => `
            <div class="book-card" onclick="viewWatchlist(${wl.id})">
                <h3>${wl.name}</h3>
                <p>${wl.description || 'No description'}</p>
                <p><strong>${wl.book_count}</strong> books</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading watchlists:', error);
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();

        const notificationList = document.getElementById('notificationList');

        if (data.notifications.length === 0) {
            notificationList.innerHTML = '<p>No notifications</p>';
            return;
        }

        notificationList.innerHTML = data.notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" onclick="markNotificationRead(${notif.id})">
                <p><strong>${notif.title}</strong> - ${notif.author}</p>
                <p>${notif.message}</p>
                <small>${new Date(notif.created_date).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function viewBookDetails(bookId) {
    try {
        const response = await fetch(`/api/book/${bookId}`);
        const data = await response.json();

        const book = data.book;
        const history = data.history;

        const modal = document.getElementById('bookModal');
        const details = document.getElementById('bookDetails');

        details.innerHTML = `
            <h2>${book.title}</h2>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Current Price:</strong> ${book.current_price ? `$${book.current_price.toFixed(2)}` : 'N/A'}</p>
            <p><strong>Rating:</strong> ${book.rating ? `${book.rating.toFixed(1)} ⭐` : 'N/A'}</p>
            <p><strong>Reviews:</strong> ${book.reviews_count || 'N/A'}</p>
            <p><strong>Pages:</strong> ${book.page_count || 'N/A'}</p>
            <p><strong>Category:</strong> ${book.category || 'N/A'}</p>
            <p><strong>Publisher:</strong> ${book.publisher || 'N/A'}</p>
            <p><strong>Published:</strong> ${book.published_date || 'N/A'}</p>
            ${book.description ? `<p><strong>Description:</strong> ${book.description}</p>` : ''}
            ${history.length > 0 ? '<canvas id="priceChart"></canvas>' : ''}
        `;

        modal.style.display = 'block';

        if (history.length > 0) {
            setTimeout(() => {
                const ctx = document.getElementById('priceChart').getContext('2d');
                if (currentChart) currentChart.destroy();

                currentChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: history.map(h => new Date(h.snapshot_date).toLocaleDateString()),
                        datasets: [{
                            label: 'Price',
                            data: history.map(h => h.price),
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }, {
                            label: 'Rating',
                            data: history.map(h => h.rating),
                            borderColor: 'rgb(255, 159, 64)',
                            tension: 0.1,
                            yAxisID: 'y1'
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left'
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                });
            }, 100);
        }
    } catch (error) {
        console.error('Error loading book details:', error);
    }
}

async function getPricingSuggestion(bookId) {
    try {
        const response = await fetch(`/api/pricing-suggestion/${bookId}`);
        const data = await response.json();

        const bookResponse = await fetch(`/api/book/${bookId}`);
        const bookData = await bookResponse.json();
        const book = bookData.book;

        const suggestionHTML = `
            <h2>💡 Pricing Suggestion for "${book.title}"</h2>
            
            <div class="pricing-suggestion-container">
                <div class="suggested-price-card">
                    <h3>Recommended Price</h3>
                    <div class="suggestion-price">$${data.suggested_price}</div>
                    <p class="price-range">Range: $${data.min_price} - $${data.max_price}</p>
                </div>

                <div class="analysis-section">
                    <h3>📊 Market Analysis</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span class="analysis-label">Competitors Analyzed:</span>
                            <span class="analysis-value">${data.analysis.competitor_count}</span>
                        </div>
                        ${data.analysis.avg_competitor_price ? `
                            <div class="analysis-item">
                                <span class="analysis-label">Avg Competitor Price:</span>
                                <span class="analysis-value">$${data.analysis.avg_competitor_price}</span>
                            </div>
                        ` : ''}
                        ${data.analysis.avg_competitor_rating ? `
                            <div class="analysis-item">
                                <span class="analysis-label">Avg Competitor Rating:</span>
                                <span class="analysis-value">${data.analysis.avg_competitor_rating} ⭐</span>
                            </div>
                        ` : ''}
                        ${data.analysis.price_range ? `
                            <div class="analysis-item">
                                <span class="analysis-label">Market Price Range:</span>
                                <span class="analysis-value">${data.analysis.price_range}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="reasoning-section">
                    <h3>🎯 Reasoning</h3>
                    <p class="reasoning-text">${data.analysis.reasoning}</p>
                </div>

                <div class="current-info-section">
                    <h3>📖 Current Book Info</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Current Price:</span>
                            <span class="info-value">${book.current_price ? `$${book.current_price.toFixed(2)}` : 'Not set'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rating:</span>
                            <span class="info-value">${book.rating ? `${book.rating.toFixed(1)} ⭐` : 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Pages:</span>
                            <span class="info-value">${book.page_count || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Category:</span>
                            <span class="info-value">${book.category || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <button class="btn btn-primary" onclick="applyPriceSuggestion(${bookId}, ${data.suggested_price})">
                        Apply Suggested Price
                    </button>
                </div>
            </div>
        `;

        document.getElementById('bookDetails').innerHTML = suggestionHTML;
        document.getElementById('bookModal').style.display = 'block';
    } catch (error) {
        console.error('Error getting pricing suggestion:', error);
        showToast('Error getting pricing suggestion', 'error');
    }
}

async function applyPriceSuggestion(bookId, suggestedPrice) {
    const confirmed = confirm(`Apply suggested price of $${suggestedPrice}?`);
    if (!confirmed) return;

    try {
        const bookResponse = await fetch(`/api/book/${bookId}`);
        const bookData = await bookResponse.json();
        const book = bookData.book;

        const response = await fetch(`/api/update-price/${bookId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                price: suggestedPrice,
                rating: book.rating,
                reviews_count: book.reviews_count
            })
        });

        if (response.ok) {
            showToast('Price updated successfully!', 'success');
            document.getElementById('bookModal').style.display = 'none';
            loadBooks();
            loadStats();
        } else {
            showToast('Error updating price', 'error');
        }
    } catch (error) {
        console.error('Error applying price suggestion:', error);
        showToast('Error applying price suggestion', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.textContent = message;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function deleteBook(bookId) {
    const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
    if (!bookCard) return;

    // Check if confirmation already exists
    if (bookCard.querySelector('.delete-confirmation')) return;

    // Create inline confirmation
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'inline-message inline-message-warning show delete-confirmation';
    confirmationDiv.innerHTML = `
        <span>Are you sure you want to delete this book?</span>
        <div style="display: flex; gap: 10px; margin-left: auto;">
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteBook(${bookId})">Delete</button>
            <button class="btn btn-secondary btn-sm" onclick="cancelDeleteBook(${bookId})">Cancel</button>
        </div>
    `;

    // Insert before book actions
    const bookActions = bookCard.querySelector('.book-actions');
    bookCard.insertBefore(confirmationDiv, bookActions);
}

async function confirmDeleteBook(bookId) {
    try {
        await fetch(`/api/book/${bookId}`, { method: 'DELETE' });
        showToast('Book deleted successfully', 'success');
        loadBooks();
        loadStats();
    } catch (error) {
        console.error('Error deleting book:', error);
        showToast('Error deleting book', 'error');
    }
}

function cancelDeleteBook(bookId) {
    const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
    if (!bookCard) return;

    const confirmation = bookCard.querySelector('.delete-confirmation');
    if (confirmation) {
        confirmation.remove();
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

async function markNotificationRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
        loadNotifications();
        loadStats();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}