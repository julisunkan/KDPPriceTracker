# KDP Books Price Tracker & Competitor Monitor

## Overview
A Progressive Web App (PWA) for tracking Kindle Direct Publishing (KDP) book prices, monitoring competitors, and providing AI-based pricing insights. Built with Flask, SQLite, and vanilla JavaScript.

**Purpose**: Help KDP authors and publishers analyze competitor pricing trends, get optimal pricing suggestions, calculate royalties, and visualize long-term analytics.

**Status**: Fully functional MVP deployed on October 22, 2025

## Features
- 📚 **Book Tracking**: Search and add books via Google Books API (ISBN, title, author)
- 🤖 **AI Pricing Engine**: Local heuristic analysis for optimal price suggestions
- 💰 **Profit Calculator**: KDP royalty calculations (35% and 70% tiers for eBooks and paperbacks)
- 📊 **Analytics**: Interactive Chart.js visualizations for price and rating trends
- 📋 **Watchlists**: Organize books by genre or author
- 📥 **Export**: Download data as CSV or PDF
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **PWA**: Offline-capable with service worker caching
- 🔔 **Notifications**: Track price and rating changes

## Tech Stack

### Backend
- **Framework**: Flask (Python 3.11)
- **WSGI Server**: Gunicorn (production-ready)
- **Database**: SQLite3
- **APIs**: Google Books API (free, no auth required)
- **Export**: Pandas (CSV), ReportLab (PDF)
- **ML**: NumPy, scikit-learn (optional advanced features)
- **Security**: Environment-based SECRET_KEY, debug mode disabled in production

### Frontend
- **UI**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js v4.4.0
- **PWA**: manifest.json, service-worker.js
- **Design**: Responsive, mobile-first with dark mode

## Project Structure
```
.
├── app.py                    # Flask backend with all API endpoints
├── database.py               # SQLite schema and initialization
├── kdp_tracker.db           # SQLite database (auto-created)
├── templates/
│   └── index.html           # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css        # Styles with dark mode support
│   ├── js/
│   │   └── app.js           # Frontend logic
│   ├── icons/               # PWA icons (72px to 512px)
│   ├── manifest.json        # PWA manifest
│   └── service-worker.js    # Service worker for offline support
├── pyproject.toml           # Python dependencies (uv)
└── replit.md               # This file
```

## Database Schema

### Tables
1. **books**: Main book data (title, author, price, rating, category, etc.)
2. **price_history**: Historical snapshots of price and rating changes
3. **watchlists**: User-created watchlists for organizing books
4. **watchlist_books**: Many-to-many relationship between watchlists and books
5. **notifications**: Price/rating change alerts

## API Endpoints

### Books
- `POST /api/search-book` - Search Google Books API
- `POST /api/add-book` - Add book to tracker
- `GET /api/books` - List all tracked books
- `GET /api/book/<id>` - Get book details with history
- `DELETE /api/book/<id>` - Remove book
- `POST /api/update-price/<id>` - Update price/rating snapshot

### Analytics
- `GET /api/pricing-suggestion/<id>` - AI-powered price suggestion
- `POST /api/profit-calculator` - KDP royalty calculator
- `GET /api/stats` - Dashboard statistics

### Watchlists
- `GET /api/watchlists` - List all watchlists
- `POST /api/watchlist` - Create new watchlist
- `GET /api/watchlist/<id>/books` - Get books in watchlist
- `POST /api/watchlist/<id>/add-book` - Add book to watchlist
- `DELETE /api/watchlist/<id>/remove-book/<book_id>` - Remove book

### System
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/<id>/read` - Mark as read
- `GET /api/export/csv` - Export as CSV
- `GET /api/export/pdf` - Export as PDF

## AI Pricing Algorithm

The pricing suggestion engine uses local heuristic analysis:

1. **Competitor Analysis**: Finds books in same category
2. **Price Calculation**: Analyzes average competitor prices
3. **Rating Adjustment**: Adjusts based on book rating vs. competitors
4. **Page Count Scaling**: Factors in book length
5. **Range Generation**: Suggests min/max/optimal pricing

**No external AI APIs required** - uses scikit-learn for optional advanced modeling.

## KDP Profit Calculator

### eBook Royalties
- **35% Tier**: All prices
- **70% Tier**: $2.99 - $9.99 (recommended)
- **Delivery Cost**: $0.15 per MB

### Paperback Royalties
- **60% Tier**: Price minus printing cost
- **Minimum**: Printing cost × 1.2

## Development

### Running Locally

**Production (recommended):**
```bash
gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 app:app
```

**Development mode:**
```bash
FLASK_DEBUG=true python app.py
```

Server runs on `http://0.0.0.0:5000`

### Environment Variables
- `SESSION_SECRET`: Secret key for Flask sessions (auto-generated if not set)
- `FLASK_DEBUG`: Set to 'true' to enable debug mode (defaults to false)

### Initialize Database
```bash
python database.py
```

### Install Dependencies
Dependencies are managed via `uv`:
```bash
uv add flask requests pandas reportlab scikit-learn
```

## PWA Features

### Offline Support
- Service worker caches static assets
- Works offline after first visit
- Installable on mobile devices

### Manifest
- App name: "KDP Books Price Tracker"
- Theme color: #1e40af (blue)
- Icons: 72px to 512px
- Display: standalone

## Recent Changes (October 22, 2025)

### Initial Implementation
- ✅ Complete Flask backend with 20+ API endpoints
- ✅ SQLite database with 5 tables
- ✅ Google Books API integration
- ✅ AI pricing suggestion engine
- ✅ KDP profit calculator (both tiers)
- ✅ Chart.js price/rating trend visualization
- ✅ Watchlist management system
- ✅ CSV/PDF export functionality
- ✅ PWA with offline support
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Notification system

## User Preferences
- No authentication/login system (as requested)
- Free APIs only (Google Books)
- Local AI processing (no paid APIs)
- Offline-first architecture
- Mobile-responsive design

## Future Enhancements
- Automated daily price scraping scheduler
- Advanced ML models for price prediction
- Email/push notifications
- Side-by-side book comparison
- Database backup/restore
- Multiple author profiles
- Genre-specific insights
