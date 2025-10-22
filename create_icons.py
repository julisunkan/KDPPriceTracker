
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a PWA icon with KDP tracker branding"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#1e40af')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (darker at top, lighter at bottom)
    for y in range(size):
        brightness = int(30 + (y / size) * 50)
        color = (30 + brightness, 64 + brightness, 175 + brightness)
        draw.line([(0, y), (size, y)], fill=color)
    
    # Draw book icon
    book_width = int(size * 0.5)
    book_height = int(size * 0.65)
    book_x = (size - book_width) // 2
    book_y = (size - book_height) // 2
    
    # Book body
    draw.rounded_rectangle(
        [(book_x, book_y), (book_x + book_width, book_y + book_height)],
        radius=size // 20,
        fill='#ffffff',
        outline='#e5e7eb',
        width=max(2, size // 128)
    )
    
    # Book spine
    spine_x = book_x + book_width // 6
    draw.line(
        [(spine_x, book_y), (spine_x, book_y + book_height)],
        fill='#d1d5db',
        width=max(2, size // 64)
    )
    
    # Price tag symbol
    tag_size = int(size * 0.25)
    tag_x = book_x + book_width - tag_size // 2
    tag_y = book_y - tag_size // 4
    
    # Draw circular price tag
    draw.ellipse(
        [(tag_x, tag_y), (tag_x + tag_size, tag_y + tag_size)],
        fill='#fbbf24',
        outline='#f59e0b',
        width=max(2, size // 128)
    )
    
    # Draw dollar sign
    try:
        font_size = tag_size // 2
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    dollar_text = "$"
    bbox = draw.textbbox((0, 0), dollar_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = tag_x + (tag_size - text_width) // 2
    text_y = tag_y + (tag_size - text_height) // 2
    
    draw.text((text_x, text_y), dollar_text, fill='#ffffff', font=font)
    
    img.save(output_path)
    print(f"Created: {output_path}")

def create_maskable_icon(size, output_path):
    """Create a maskable icon with safe zone padding"""
    # Maskable icons need 10% safe zone
    safe_zone = int(size * 0.1)
    inner_size = size - (2 * safe_zone)
    
    # Create full size image with solid background
    img = Image.new('RGB', (size, size), color='#1e40af')
    
    # Create inner icon
    inner_img = Image.new('RGBA', (inner_size, inner_size), color=(0, 0, 0, 0))
    
    # Scale down the design for safe zone
    create_icon(inner_size, 'temp_inner.png')
    inner_icon = Image.open('temp_inner.png')
    
    # Paste centered
    img.paste(inner_icon, (safe_zone, safe_zone))
    
    # Clean up temp file
    os.remove('temp_inner.png')
    
    img.save(output_path)
    print(f"Created maskable: {output_path}")

# Create all required icon sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
icons_dir = 'static/icons'

# Ensure icons directory exists
os.makedirs(icons_dir, exist_ok=True)

print("Generating PWA icons...")
for size in sizes:
    # Regular icon
    create_icon(size, f'{icons_dir}/icon-{size}x{size}.png')
    
    # Maskable icon for adaptive icons
    create_maskable_icon(size, f'{icons_dir}/icon-{size}x{size}-maskable.png')

print("\nAll icons generated successfully!")
print("Regular icons: For standard display")
print("Maskable icons: For adaptive/safe zone compliance")
