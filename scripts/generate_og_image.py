from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1200, 630
img = Image.new("RGB", (width, height), color=(253, 251, 247))
draw = ImageDraw.Draw(img)

# Accent gradient banner on left edge
for x in range(16):
    draw.line([(x, 0), (x, height)], fill=(255, 87, 34))

# Load mascot hero
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mascot_path = os.path.join(base_dir, "frontend", "public", "brand", "mascot-hero.jpg")

if os.path.exists(mascot_path):
    mascot = Image.open(mascot_path)
    mascot = mascot.resize((560, 560), Image.Resampling.LANCZOS)
    img.paste(mascot, (610, 35))

# Draw Brand Typography
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 68)
    font_sub = ImageFont.truetype("arialbd.ttf", 46)
    font_tag = ImageFont.truetype("arial.ttf", 22)
    font_badge = ImageFont.truetype("arialbd.ttf", 18)
except Exception:
    font_bold = ImageFont.load_default()
    font_sub = font_bold
    font_tag = font_bold
    font_badge = font_bold

# Badge
draw.rounded_rectangle([(60, 60), (330, 102)], radius=20, fill=(230, 57, 70))
draw.text((85, 71), "BHUKKAD VERSE", fill=(255, 255, 255), font=font_badge)

# Main Title
draw.text((60, 130), "BHUKKAD", fill=(26, 26, 26), font=font_bold)
draw.text((60, 215), "VERSE", fill=(255, 87, 34), font=font_sub)

# Tagline
draw.text((60, 290), "YOUR CRAVINGS. YOUR UNIVERSE.", fill=(26, 26, 26), font=font_tag)

# Feature Badges
draw.rounded_rectangle([(60, 360), (580, 412)], radius=12, fill=(245, 240, 230), outline=(225, 215, 200))
draw.text((80, 376), "Explore Nearby Shops • 3D Food Showcase", fill=(40, 40, 40), font=font_badge)

draw.rounded_rectangle([(60, 430), (580, 482)], radius=12, fill=(245, 240, 230), outline=(225, 215, 200))
draw.text((80, 446), "Seamless Multi-Vendor Cart & Fast Delivery", fill=(40, 40, 40), font=font_badge)

output_path = os.path.join(base_dir, "frontend", "public", "brand", "og-image.png")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, "PNG")
print("OG Image generated successfully at:", output_path)
