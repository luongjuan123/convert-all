#!/usr/bin/env python3
import sys
import os
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
        
        # If single page or target output path ends with extension
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

def main():
    parser = argparse.ArgumentParser(description="PDF Conversion Helper Script")
    parser.add_argument("--mode", required=True, choices=["docx", "jpg", "png", "txt"])
    parser.add_argument("--input", required=True, help="Input PDF path")
    parser.add_argument("--output", required=True, help="Output file path")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file {args.input} does not exist", file=sys.stderr)
        sys.exit(1)
        
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    
    if args.mode == "docx":
        success, msg = convert_pdf_to_docx(args.input, args.output)
    elif args.mode in ["jpg", "png"]:
        success, msg = convert_pdf_to_images(args.input, args.output, img_format=args.mode)
    elif args.mode == "txt":
        success, msg = extract_pdf_txt(args.input, args.output)
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
