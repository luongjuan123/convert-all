# Production Multi-Stage Dockerfile for Universal File Converter
FROM node:20-slim AS base

# Install system dependencies (FFmpeg, LibreOffice, Ghostscript, Poppler, Python3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libreoffice \
    ghostscript \
    poppler-utils \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for PDF to DOCX conversion
RUN python3 -m pip install --no-cache-dir pdf2docx pillow pymupdf pypdf python-docx fire --break-system-packages 2>/dev/null || \
    python3 -m pip install --no-cache-dir pdf2docx pillow pymupdf pypdf python-docx fire

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit

# Copy application source code
COPY . .

# Build Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Cloud Run execution port
EXPOSE 8080
ENV PORT=8080

CMD ["npm", "start"]
