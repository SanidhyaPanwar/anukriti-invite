!pip install pymupdf -q

import fitz
from google.colab import files

# 1. Upload the PDF
print("Upload your PDF file:")
uploaded = files.upload()
input_name = list(uploaded.keys())[0]
output_name = "Cleaned_" + input_name

doc = fitz.open(input_name)
bg_color = (0.98, 0.97, 0.95)  # Parchment background match

for page_num, page in enumerate(doc):
    rect = page.rect
    width = rect.width
    height = rect.height
    
    if page_num == 0:
        # TIGHTER BOUNDS for Page 1: Only the middle-top logo
        # Shifted Y-axis up (5% to 18%) to avoid erasing the main title
        logo_rect = fitz.Rect(width * 0.35, height * 0.05, width * 0.65, height * 0.18)
        page.add_redact_annot(logo_rect, fill=bg_color)
        
    else:
        # TIGHTER BOUNDS for Pages 2+: Extreme top-right corner only
        # Shrunk to the rightmost 12% and topmost 8% to avoid cutting slide content
        top_right_rect = fitz.Rect(width * 0.88, 0, width, height * 0.08)
        page.add_redact_annot(top_right_rect, fill=bg_color)
        
    # Apply the redaction
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

# 2. Save and download
doc.save(output_name, garbage=4, deflate=True)
doc.close()

files.download(output_name)
print(f"Successfully processed with tighter margins and downloaded: {output_name}")