#!/usr/bin/env python3
import sys
import os
import io
import json
import re
import argparse

def convert_pdf_to_docx(pdf_path, docx_path):
    try:
        from pdf2docx import Converter
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        return True, "Converted PDF to DOCX successfully"
    except Exception as e:
        return False, str(e)

def convert_pdf_to_images(pdf_path, output_path, img_format="png", dpi=150):
    try:
        import pymupdf as fitz
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        if page_count == 0:
            doc.close()
            return False, "PDF contains no pages"
        
        for page_num in range(page_count):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=dpi)
            if page_count == 1:
                target_file = output_path
            else:
                base, ext = os.path.splitext(output_path)
                target_file = f"{base}_page_{page_num+1}{ext}"
            pix.save(target_file)
        doc.close()
        return True, f"Rendered {page_count} pages as {img_format.upper()}"
    except Exception as e:
        return False, str(e)

def extract_pdf_txt(pdf_path, txt_path):
    try:
        import fitz
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n\n"
        doc.close()
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        return True, "Extracted text successfully"
    except Exception as e:
        return False, str(e)

def merge_pdfs(input_paths, output_path):
    if not input_paths or len(input_paths) == 0:
        return False, "No input PDF files provided to merge."
    
    try:
        import pymupdf as fitz
        merged_doc = fitz.open()
        total_pages = 0

        for idx, pdf_path in enumerate(input_paths):
            filename = os.path.basename(pdf_path)
            if not os.path.exists(pdf_path):
                merged_doc.close()
                return False, f"File '{filename}' was not found on the server."
            
            try:
                doc = fitz.open(pdf_path)
            except Exception as e:
                merged_doc.close()
                return False, f"File '{filename}' is corrupt or not a valid PDF document."
            
            if doc.is_encrypted:
                doc.close()
                merged_doc.close()
                return False, f"File '{filename}' is password-protected and cannot be merged."
            
            if len(doc) == 0:
                doc.close()
                merged_doc.close()
                return False, f"File '{filename}' contains no pages."
            
            try:
                merged_doc.insert_pdf(doc)
                total_pages += len(doc)
            except Exception as e:
                doc.close()
                merged_doc.close()
                return False, f"Failed to merge pages from '{filename}': {str(e)}"
            finally:
                doc.close()
        
        if len(merged_doc) == 0:
            merged_doc.close()
            return False, "The combined document contains no pages."

        merged_doc.save(output_path, deflate=True, garbage=3)
        merged_doc.close()

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return False, "Generated merged PDF file is empty or missing."

        return True, f"Successfully merged {len(input_paths)} PDF files ({total_pages} pages)."
    except Exception as e:
        return False, f"Unexpected error merging PDF documents: {str(e)}"

def convert_images_to_pdf(input_paths, output_path):
    if not input_paths or len(input_paths) == 0:
        return False, "No image files provided to convert."
    
    try:
        import pymupdf as fitz
        from PIL import Image, ImageOps

        doc = fitz.open()

        for idx, img_path in enumerate(input_paths):
            filename = os.path.basename(img_path)
            if not os.path.exists(img_path):
                doc.close()
                return False, f"Image '{filename}' was not found on the server."
            
            try:
                with Image.open(img_path) as raw_im:
                    im = ImageOps.exif_transpose(raw_im)

                    if im.mode in ("RGBA", "LA") or ("transparency" in im.info):
                        bg = Image.new("RGB", im.size, (255, 255, 255))
                        if im.mode == "RGBA":
                            bg.paste(im, mask=im.split()[3])
                        else:
                            im_rgb = im.convert("RGBA")
                            bg.paste(im_rgb, mask=im_rgb.split()[3])
                        im = bg
                    elif im.mode != "RGB":
                        im = im.convert("RGB")

                    w, h = im.size
                    if w <= 0 or h <= 0:
                        doc.close()
                        return False, f"Image '{filename}' has invalid dimensions."

                    if w >= h:
                        page_w, page_h = 841.92, 595.32
                    else:
                        page_w, page_h = 595.32, 841.92

                    margin = 20.0
                    avail_w = page_w - 2.0 * margin
                    avail_h = page_h - 2.0 * margin

                    scale = min(avail_w / w, avail_h / h)
                    draw_w = w * scale
                    draw_h = h * scale
                    draw_x = margin + (avail_w - draw_w) / 2.0
                    draw_y = margin + (avail_h - draw_h) / 2.0

                    page = doc.new_page(width=page_w, height=page_h)
                    rect = fitz.Rect(draw_x, draw_y, draw_x + draw_w, draw_y + draw_h)

                    buf = io.BytesIO()
                    im.save(buf, format="JPEG", quality=92, optimize=True)
                    page.insert_image(rect, stream=buf.getvalue())
            except Exception as e:
                doc.close()
                return False, f"Failed to process image '{filename}': {str(e)}"

        if len(doc) == 0:
            doc.close()
            return False, "Failed to create PDF pages from uploaded images."

        doc.save(output_path, deflate=True, garbage=3)
        doc.close()

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return False, "Generated PDF from images is empty or missing."

        return True, f"Successfully converted {len(input_paths)} images to PDF."
    except Exception as e:
        return False, f"Unexpected error converting images to PDF: {str(e)}"

def sanitize_html_content(html):
    html = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r'<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>', '', html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r'<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>', '', html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r'<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>', '', html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r'href\s*=\s*["\']javascript:[^"\']*["\']', 'href="#"', html, flags=re.IGNORECASE)
    html = re.sub(r'src\s*=\s*["\']javascript:[^"\']*["\']', 'src="#"', html, flags=re.IGNORECASE)
    return html

def convert_markdown_to_pdf(md_path, output_path):
    if not os.path.exists(md_path):
        return False, "Markdown file not found."
    
    try:
        import markdown
        import pymupdf as fitz

        with open(md_path, "r", encoding="utf-8", errors="replace") as f:
            md_text = f.read()

        if not md_text.strip():
            doc = fitz.open()
            page = doc.new_page(width=595.32, height=841.92)
            page.insert_text((50, 100), "Empty Markdown Document", fontsize=12)
            doc.save(output_path)
            doc.close()
            return True, "Converted empty Markdown document to PDF."

        raw_html = markdown.markdown(
            md_text,
            extensions=["extra", "sane_lists", "tables", "codehilite", "nl2br"]
        )

        sanitized_html = sanitize_html_content(raw_html)

        styled_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1e293b;
    margin: 0;
    padding: 0;
}}
h1, h2, h3, h4, h5, h6 {{
    color: #0f172a;
    font-weight: 700;
    margin-top: 18px;
    margin-bottom: 8px;
    break-after: avoid;
    page-break-after: avoid;
}}
h1 {{
    font-size: 20pt;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 6px;
    margin-top: 0;
}}
h2 {{
    font-size: 14pt;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
}}
h3 {{
    font-size: 12pt;
}}
p {{
    margin-top: 0;
    margin-bottom: 10px;
}}
a {{
    color: #0284c7;
    text-decoration: underline;
}}
ul, ol {{
    margin-top: 0;
    margin-bottom: 10px;
    padding-left: 22px;
}}
li {{
    margin-bottom: 4px;
}}
blockquote {{
    border-left: 4px solid #3b82f6;
    background-color: #f8fafc;
    margin: 12px 0;
    padding: 8px 14px;
    color: #475569;
    font-style: italic;
}}
table {{
    border-collapse: collapse;
    width: 100%;
    margin: 14px 0;
    font-size: 9.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
}}
th, td {{
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
}}
th {{
    background-color: #f1f5f9;
    font-weight: 600;
    color: #0f172a;
}}
tr:nth-child(even) {{
    background-color: #f8fafc;
}}
code {{
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 3px;
    color: #e11d48;
}}
pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 10px 14px;
    border-radius: 6px;
    margin: 12px 0;
    word-break: break-all;
    white-space: pre-wrap;
    break-inside: avoid;
    page-break-inside: avoid;
}}
pre code {{
    background-color: transparent;
    color: #38bdf8;
    padding: 0;
}}
hr {{
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
}}
</style>
</head>
<body>
{sanitized_html}
</body>
</html>"""

        story = fitz.Story(html=styled_html)
        writer = fitz.DocumentWriter(output_path)
        mediabox = fitz.Rect(0, 0, 595.32, 841.92)
        margin_x, margin_y = 40.0, 45.0
        where = fitz.Rect(margin_x, margin_y, 595.32 - margin_x, 841.92 - margin_y)

        more = 1
        while more:
            device = writer.begin_page(mediabox)
            more, _ = story.place(where)
            story.draw(device)
            writer.end_page()

        writer.close()

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return False, "Generated PDF from Markdown is empty or missing."

        return True, "Converted Markdown to PDF successfully"
    except Exception as e:
        return False, f"Failed to convert Markdown to PDF: {str(e)}"

def main():
    parser = argparse.ArgumentParser(description="ConvertAll PDF & Document Engine")
    parser.add_argument(
        "--mode",
        required=True,
        choices=["docx", "jpg", "png", "txt", "merge", "images_to_pdf", "markdown_to_pdf"]
    )
    parser.add_argument("--input", help="Single input file path")
    parser.add_argument("--inputs", nargs="*", help="Multiple input file paths")
    parser.add_argument("--input-list", help="Path to JSON file containing array of input paths")
    parser.add_argument("--output", required=True, help="Target output file path")

    args = parser.parse_args()

    input_paths = []
    if args.input_list and os.path.exists(args.input_list):
        try:
            with open(args.input_list, "r", encoding="utf-8") as f:
                input_paths = json.load(f)
        except Exception as e:
            print(f"Error reading --input-list: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.inputs:
        input_paths = args.inputs
    elif args.input:
        input_paths = [args.input]

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    if args.mode == "docx":
        if not input_paths:
            print("Error: --input required for docx mode", file=sys.stderr)
            sys.exit(1)
        success, msg = convert_pdf_to_docx(input_paths[0], args.output)
    elif args.mode in ["jpg", "png"]:
        if not input_paths:
            print(f"Error: --input required for {args.mode} mode", file=sys.stderr)
            sys.exit(1)
        success, msg = convert_pdf_to_images(input_paths[0], args.output, img_format=args.mode)
    elif args.mode == "txt":
        if not input_paths:
            print("Error: --input required for txt mode", file=sys.stderr)
            sys.exit(1)
        success, msg = extract_pdf_txt(input_paths[0], args.output)
    elif args.mode == "merge":
        success, msg = merge_pdfs(input_paths, args.output)
    elif args.mode == "images_to_pdf":
        success, msg = convert_images_to_pdf(input_paths, args.output)
    elif args.mode == "markdown_to_pdf":
        if not input_paths:
            print("Error: --input required for markdown_to_pdf mode", file=sys.stderr)
            sys.exit(1)
        success, msg = convert_markdown_to_pdf(input_paths[0], args.output)
    else:
        success, msg = False, "Unknown mode"

    if success:
        print(msg)
        sys.exit(0)
    else:
        print(f"Error: {msg}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

