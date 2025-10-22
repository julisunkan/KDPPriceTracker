from flask import Flask, render_template, request, jsonify, send_file
import sqlite3
from datetime import datetime, timedelta
import requests
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
import json
import os
from database import init_db, get_db_connection
import numpy as np
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', os.urandom(24).hex())

init_db()

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search-book', methods=['POST'])
def search_book():
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        params = {'q': query, 'maxResults': 10}
        response = requests.get(GOOGLE_BOOKS_API, params=params, timeout=10)
        response.raise_for_status()
        
        books_data = response.json()
        results = []
        
        if 'items' in books_data:
            for item in books_data['items']:
                volume_info = item.get('volumeInfo', {})
                sale_info = item.get('saleInfo', {})
                
                isbn = None
                if 'industryIdentifiers' in volume_info:
                    for identifier in volume_info['industryIdentifiers']:
                        if identifier['type'] in ['ISBN_13', 'ISBN_10']:
                            isbn = identifier['identifier']
                            break
                
                price = None
                if sale_info.get('saleability') == 'FOR_SALE':
                    price = sale_info.get('listPrice', {}).get('amount')
                
                book = {
                    'isbn': isbn or item.get('id'),
                    'title': volume_info.get('title', 'Unknown Title'),
                    'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                    'price': price,
                    'rating': volume_info.get('averageRating'),
                    'reviews_count': volume_info.get('ratingsCount'),
                    'page_count': volume_info.get('pageCount'),
                    'category': ', '.join(volume_info.get('categories', [])),
                    'publisher': volume_info.get('publisher'),
                    'published_date': volume_info.get('publishedDate'),
                    'description': volume_info.get('description', ''),
                    'thumbnail_url': volume_info.get('imageLinks', {}).get('thumbnail')
                }
                results.append(book)
        
        return jsonify({'books': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/add-book', methods=['POST'])
def add_book():
    data = request.json
    
    required_fields = ['title', 'author']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO books (isbn, title, author, current_price, rating, reviews_count, 
                             page_count, category, publisher, published_date, description, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('isbn'),
            data['title'],
            data['author'],
            data.get('price'),
            data.get('rating'),
            data.get('reviews_count'),
            data.get('page_count'),
            data.get('category'),
            data.get('publisher'),
            data.get('published_date'),
            data.get('description'),
            data.get('thumbnail_url')
        ))
        
        book_id = cursor.lastrowid
        
        if data.get('price') is not None:
            cursor.execute('''
                INSERT INTO price_history (book_id, price, rating, reviews_count)
                VALUES (?, ?, ?, ?)
            ''', (book_id, data.get('price'), data.get('rating'), data.get('reviews_count')))
        
        conn.commit()
        return jsonify({'success': True, 'book_id': book_id})
    
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Book already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/books', methods=['GET'])
def get_books():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM books ORDER BY added_date DESC')
    books = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify({'books': books})

@app.route('/api/book/<int:book_id>', methods=['GET'])
def get_book(book_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
    book = cursor.fetchone()
    
    if not book:
        conn.close()
        return jsonify({'error': 'Book not found'}), 404
    
    cursor.execute('''
        SELECT * FROM price_history 
        WHERE book_id = ? 
        ORDER BY snapshot_date ASC
    ''', (book_id,))
    history = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify({'book': dict(book), 'history': history})

@app.route('/api/book/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM books WHERE id = ?', (book_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/update-price/<int:book_id>', methods=['POST'])
def update_price(book_id):
    data = request.json
    new_price = data.get('price')
    new_rating = data.get('rating')
    new_reviews = data.get('reviews_count')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT current_price, rating FROM books WHERE id = ?', (book_id,))
    book = cursor.fetchone()
    
    if not book:
        conn.close()
        return jsonify({'error': 'Book not found'}), 404
    
    old_price = book['current_price']
    old_rating = book['rating']
    
    cursor.execute('''
        UPDATE books 
        SET current_price = ?, rating = ?, reviews_count = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (new_price, new_rating, new_reviews, book_id))
    
    cursor.execute('''
        INSERT INTO price_history (book_id, price, rating, reviews_count)
        VALUES (?, ?, ?, ?)
    ''', (book_id, new_price, new_rating, new_reviews))
    
    if old_price and new_price and abs(old_price - new_price) > 0.5:
        change_type = 'increase' if new_price > old_price else 'decrease'
        message = f"Price {change_type}: ${old_price:.2f} → ${new_price:.2f}"
        cursor.execute('''
            INSERT INTO notifications (book_id, message, notification_type)
            VALUES (?, ?, ?)
        ''', (book_id, message, 'price_change'))
    
    if old_rating and new_rating and abs(old_rating - new_rating) >= 0.3:
        change_type = 'increased' if new_rating > old_rating else 'decreased'
        message = f"Rating {change_type}: {old_rating:.1f} → {new_rating:.1f}"
        cursor.execute('''
            INSERT INTO notifications (book_id, message, notification_type)
            VALUES (?, ?, ?)
        ''', (book_id, message, 'rating_change'))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/pricing-suggestion/<int:book_id>', methods=['GET'])
def get_pricing_suggestion(book_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
    book = cursor.fetchone()
    
    if not book:
        conn.close()
        return jsonify({'error': 'Book not found'}), 404
    
    book_dict = dict(book)
    category = book_dict.get('category', '')
    page_count = book_dict.get('page_count', 0)
    rating = book_dict.get('rating', 0)
    
    cursor.execute('''
        SELECT current_price, rating, page_count, 
               (julianday('now') - julianday(published_date)) as days_since_pub
        FROM books 
        WHERE category LIKE ? AND current_price IS NOT NULL AND id != ?
    ''', (f'%{category.split(",")[0] if category else ""}%', book_id))
    
    competitors = cursor.fetchall()
    conn.close()
    
    if not competitors:
        base_price = 2.99
        if page_count > 300:
            base_price = 4.99
        if page_count > 500:
            base_price = 9.99
        
        return jsonify({
            'suggested_price': round(base_price, 2),
            'min_price': round(base_price * 0.8, 2),
            'max_price': round(base_price * 1.2, 2),
            'analysis': {
                'competitor_count': 0,
                'avg_competitor_price': None,
                'price_range': None,
                'reasoning': 'Based on page count analysis (no competitors found in category)'
            }
        })
    
    prices = [c['current_price'] for c in competitors if c['current_price']]
    ratings = [c['rating'] for c in competitors if c['rating']]
    page_counts = [c['page_count'] for c in competitors if c['page_count']]
    
    avg_price = np.mean(prices) if prices else 2.99
    avg_rating = np.mean(ratings) if ratings else 4.0
    
    suggested_price = avg_price
    
    if rating and avg_rating:
        if rating > avg_rating + 0.5:
            suggested_price *= 1.15
        elif rating < avg_rating - 0.5:
            suggested_price *= 0.90
    
    if page_count and page_counts:
        avg_pages = np.mean(page_counts)
        if page_count > avg_pages * 1.3:
            suggested_price *= 1.1
        elif page_count < avg_pages * 0.7:
            suggested_price *= 0.95
    
    suggested_price = max(0.99, min(suggested_price, 9.99))
    
    return jsonify({
        'suggested_price': round(suggested_price, 2),
        'min_price': round(suggested_price * 0.85, 2),
        'max_price': round(suggested_price * 1.15, 2),
        'analysis': {
            'competitor_count': len(competitors),
            'avg_competitor_price': round(avg_price, 2),
            'avg_competitor_rating': round(avg_rating, 2) if ratings else None,
            'price_range': f"${min(prices):.2f} - ${max(prices):.2f}",
            'reasoning': 'Based on competitor analysis in same category'
        }
    })

@app.route('/api/profit-calculator', methods=['POST'])
def calculate_profit():
    data = request.json
    price = data.get('price', 0)
    format_type = data.get('format', 'ebook')
    
    if format_type == 'ebook':
        if price < 2.99:
            royalty_rate = 0.35
            delivery_cost = 0
        elif price <= 9.99:
            royalty_rate = 0.70
            delivery_cost = data.get('file_size', 2) * 0.15
        else:
            royalty_rate = 0.35
            delivery_cost = 0
        
        profit = (price * royalty_rate) - delivery_cost
        
        return jsonify({
            'profit_per_sale': round(profit, 2),
            'royalty_rate': int(royalty_rate * 100),
            'delivery_cost': round(delivery_cost, 2),
            'recommended_range': {
                'min': 2.99,
                'max': 9.99,
                'reason': '70% royalty tier for ebooks'
            }
        })
    
    elif format_type == 'paperback':
        printing_cost = data.get('printing_cost', 3.00)
        royalty_rate = 0.60
        
        if price < printing_cost * 1.2:
            return jsonify({
                'error': 'Price too low',
                'min_price': round(printing_cost * 1.2, 2)
            }), 400
        
        profit = (price - printing_cost) * royalty_rate
        
        return jsonify({
            'profit_per_sale': round(profit, 2),
            'royalty_rate': int(royalty_rate * 100),
            'printing_cost': printing_cost,
            'recommended_range': {
                'min': round(printing_cost * 1.5, 2),
                'max': round(printing_cost * 3, 2),
                'reason': 'Competitive pricing for paperback'
            }
        })
    
    else:  # hardcover
        printing_cost = data.get('printing_cost', 5.50)
        royalty_rate = 0.60
        
        if price < printing_cost * 1.2:
            return jsonify({
                'error': 'Price too low',
                'min_price': round(printing_cost * 1.2, 2)
            }), 400
        
        profit = (price - printing_cost) * royalty_rate
        
        return jsonify({
            'profit_per_sale': round(profit, 2),
            'royalty_rate': int(royalty_rate * 100),
            'printing_cost': printing_cost,
            'recommended_range': {
                'min': round(printing_cost * 2, 2),
                'max': round(printing_cost * 4, 2),
                'reason': 'Premium pricing for hardcover'
            }
        })

@app.route('/api/watchlists', methods=['GET'])
def get_watchlists():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT w.*, COUNT(wb.book_id) as book_count
        FROM watchlists w
        LEFT JOIN watchlist_books wb ON w.id = wb.watchlist_id
        GROUP BY w.id
        ORDER BY w.created_date DESC
    ''')
    
    watchlists = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'watchlists': watchlists})

@app.route('/api/watchlist', methods=['POST'])
def create_watchlist():
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO watchlists (name, description)
            VALUES (?, ?)
        ''', (name, description))
        
        watchlist_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({'success': True, 'watchlist_id': watchlist_id})
    
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Watchlist with this name already exists'}), 400
    finally:
        conn.close()

@app.route('/api/watchlist/<int:watchlist_id>/books', methods=['GET'])
def get_watchlist_books(watchlist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT b.*, wb.added_date as watchlist_added_date
        FROM books b
        JOIN watchlist_books wb ON b.id = wb.book_id
        WHERE wb.watchlist_id = ?
        ORDER BY wb.added_date DESC
    ''', (watchlist_id,))
    
    books = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'books': books})

@app.route('/api/watchlist/<int:watchlist_id>/add-book', methods=['POST'])
def add_book_to_watchlist(watchlist_id):
    data = request.json
    book_id = data.get('book_id')
    
    if not book_id:
        return jsonify({'error': 'Book ID is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO watchlist_books (watchlist_id, book_id)
            VALUES (?, ?)
        ''', (watchlist_id, book_id))
        
        conn.commit()
        return jsonify({'success': True})
    
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Book already in watchlist'}), 400
    finally:
        conn.close()

@app.route('/api/watchlist/<int:watchlist_id>/remove-book/<int:book_id>', methods=['DELETE'])
def remove_book_from_watchlist(watchlist_id, book_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM watchlist_books 
        WHERE watchlist_id = ? AND book_id = ?
    ''', (watchlist_id, book_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/watchlist/<int:watchlist_id>', methods=['DELETE'])
def delete_watchlist(watchlist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM watchlists WHERE id = ?', (watchlist_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT n.*, b.title, b.author
        FROM notifications n
        JOIN books b ON n.book_id = b.id
        ORDER BY n.created_date DESC
        LIMIT 50
    ''')
    
    notifications = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'notifications': notifications})

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', (notification_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    view_mode = request.args.get('view', 'false').lower() == 'true'
    conn = get_db_connection()
    
    df = pd.read_sql_query('SELECT * FROM books', conn)
    conn.close()
    
    if view_mode:
        # Render CSV as HTML table
        html_table = df.to_html(classes='csv-table', index=False, border=0)
        return render_template('export_view.html', 
                             export_type='CSV',
                             content=html_table,
                             filename=f'kdp_books_{datetime.now().strftime("%Y%m%d")}.csv')
    
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'kdp_books_{datetime.now().strftime("%Y%m%d")}.csv'
    )

@app.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    view_mode = request.args.get('view', 'false').lower() == 'true'
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT title, author, current_price, rating, category FROM books')
    books = cursor.fetchall()
    conn.close()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    
    elements = []
    styles = getSampleStyleSheet()
    
    title = Paragraph("KDP Books Price Tracker Report", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    date_para = Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal'])
    elements.append(date_para)
    elements.append(Spacer(1, 20))
    
    data = [['Title', 'Author', 'Price', 'Rating', 'Category']]
    
    for book in books:
        data.append([
            book['title'][:30],
            book['author'][:25],
            f"${book['current_price']:.2f}" if book['current_price'] else 'N/A',
            f"{book['rating']:.1f}" if book['rating'] else 'N/A',
            book['category'][:20] if book['category'] else 'N/A'
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    doc.build(elements)
    
    buffer.seek(0)
    
    if view_mode:
        # Return PDF to be viewed inline
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=f'kdp_books_{datetime.now().strftime("%Y%m%d")}.pdf'
        )
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'kdp_books_{datetime.now().strftime("%Y%m%d")}.pdf'
    )

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total_books FROM books')
    total_books = cursor.fetchone()['total_books']
    
    cursor.execute('SELECT AVG(current_price) as avg_price FROM books WHERE current_price IS NOT NULL')
    avg_price = cursor.fetchone()['avg_price'] or 0
    
    cursor.execute('SELECT AVG(rating) as avg_rating FROM books WHERE rating IS NOT NULL')
    avg_rating = cursor.fetchone()['avg_rating'] or 0
    
    cursor.execute('SELECT COUNT(*) as unread_notifications FROM notifications WHERE is_read = 0')
    unread_notifications = cursor.fetchone()['unread_notifications']
    
    conn.close()
    
    return jsonify({
        'total_books': total_books,
        'avg_price': round(avg_price, 2),
        'avg_rating': round(avg_rating, 2),
        'unread_notifications': unread_notifications
    })

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
