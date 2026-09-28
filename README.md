# Universal File Converter – Production Ready Application

A high-performance, open-source universal online file converter web application designed for deployment on **Firebase Hosting + Google Cloud Run** supporting large files up to **2 GB**.

## Features & Product Concept
- **Files Up To 2 GB Supported**: Direct browser-to-Cloud Storage resumable upload architecture for multi-gigabyte files.
- **No Accounts, No Login, No Subscription**: Anonymous, friction-free conversion experience.
- **Monetization Ready**: Integrated Google AdSense `<AdSlot />` components (non-intrusive, zero CLS).
- **Universal Format Support**:
  - **PDF**: PDF → DOCX, PDF → JPG, PDF → PNG, PDF → TXT, JPG → PDF, PNG → PDF, Merge PDF, Split PDF, Compress PDF.
  - **Image**: JPG, PNG, WEBP, AVIF, HEIC conversions, image compression & EXIF orientation preservation.
  - **Video (FFmpeg)**: MP4 → MP3, MP4 → WEBM, MP4 → GIF, MOV → MP4, WEBM → MP4, video compression presets.
  - **Audio (FFmpeg)**: WAV → MP3, MP3 → WAV, FLAC → MP3, M4A → MP3, selectable bitrates (128 - 320 kbps).
  - **Office (LibreOffice)**: DOCX/DOC/PPTX/PPT/XLSX/XLS → PDF.
- **Privacy & Automatic Deletion**: All uploaded and generated files are automatically purged within 1 hour.
- **Security & Abuse Protections**: Rate limiting per IP, MIME & magic byte validation, path traversal prevention, safe argument array process execution.

---

## Architecture Overview

```
User (Browser)
     ↓ (Direct Resumable Upload)
Google Cloud Storage / API Upload Session
     ↓
Firebase Hosting (CDN / Static / Rewrites)
     ↓
Next.js App & API Routes
     ↓
Modular Conversion Engine (FFmpeg, LibreOffice, PyMuPDF, pdf2docx, Sharp, pdf-lib)
     ↓
Cloud Run Conversion Workers (Streamed Processing)
     ↓
Temporary Storage (Local Filesystem / Google Cloud Storage)
     ↓
Direct Stream Download (Range Request / HTTP 206 Support)
```

---

## Large File Cost Considerations

Supporting files up to **2 GB** creates specific infrastructure cost considerations:

1. **Cloud Storage Costs**: Temporary storage incurs minimal cost because files are automatically deleted within 1 hour via application cleanup and Google Cloud Storage Lifecycle rules.
2. **Cloud Run Compute Limits**: Cloud Run container instances are capped using `--max-instances 5` and `--min-instances 0` to ensure idle costs remain at **$0**. Large video conversions process 1 file per worker instance to prevent RAM/CPU exhaustion.
3. **Data Egress**: Downloads stream directly from Cloud Storage or streaming API handlers without proxying entire 2 GB files into server memory.

### Lowering File Size Limits for Cost Control
If operating costs need to be lowered, adjust the central configuration variable `MAX_UPLOAD_SIZE_BYTES` in `.env.local` or environment settings:
```env
MAX_UPLOAD_SIZE_BYTES=524288000  # Lower limit to 500 MB
```

---

## Local Development Setup

### 1. Requirements
- Node.js v20+ & npm
- Python 3.10+
- FFmpeg (`/usr/bin/ffmpeg`)
- LibreOffice (`/usr/bin/libreoffice`)
- Ghostscript (`/usr/bin/gs`)

### 2. Install Dependencies
```bash
# Install Node dependencies
npm install

# Install Python conversion helper libraries
python3 -m pip install pdf2docx pillow pymupdf pypdf python-docx fire
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```

---

## Deploying to Firebase + Google Cloud

This application is designed for serverless cost-efficiency on Google Cloud:
- **Firebase Hosting** serves global static assets and routes API requests via rewrites.
- **Cloud Run** runs the containerized Next.js app containing FFmpeg, LibreOffice, Ghostscript, and Python conversion dependencies.

### Step 1: Install & Authenticate CLI Tools
```bash
npm install -g firebase-tools
gcloud auth login
gcloud auth configure-docker
```

### Step 2: Set your Google Cloud Project ID
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Deploy via One-Click Script
```bash
npm run deploy YOUR_PROJECT_ID
```

### Step 4: What the Deploy Script Does Automatically
1. Builds the production Docker image with `gcloud builds submit`.
2. Deploys the container to Cloud Run with scale-to-zero settings (`--min-instances 0 --max-instances 5`) to keep idle costs at **$0**.
3. Deploys Firebase Hosting rewrites pointing to Cloud Run.

---

## Environment Variables Configuration

Copy `.env.example` to `.env.local` to customize settings:

```env
PUBLIC_SITE_URL=https://fileconverter.app
MAX_UPLOAD_SIZE_BYTES=2147483648    # 2 GB (2,147,483,648 bytes)
LARGE_FILE_THRESHOLD_BYTES=524288000 # 500 MB
FILE_EXPIRATION_MINUTES=60          # 1 Hour auto-cleanup
MAX_CONCURRENT_JOBS=4
MAX_LARGE_CONCURRENT_JOBS=1
TEMP_STORAGE_PATH=/tmp/file-converter-storage

# Optional Monetization & Analytics
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## File Cleanup Mechanism

File cleanup is handled automatically in two layers:
1. **Application-level Cleanup**: Triggered periodically or via API endpoint `/api/cleanup`.
2. **Cloud Storage Lifecycle Rule**: Objects in temporary buckets are set to expire automatically after 1 day.

Manual cleanup run:
```bash
npm run cleanup
```

---

## Security & Maintenance
- Files are assigned cryptographically random UUID job IDs.
- Raw filenames are sanitized and isolated from command-line executions.
- Rate limiting prevents DoS and high cloud bills.
