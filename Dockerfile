# Production Multi-Stage Dockerfile for Universal File Converter
FROM node:20-slim AS base

# Install system dependencies (FFmpeg, LibreOffice, Ghostscript, Poppler, Python3, Unicode fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libreoffice \
    ghostscript \
    poppler-utils \
    python3 \
    python3-pip \
    fonts-dejavu-core \
    fonts-liberation \
    fontconfig \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for PDF to DOCX, PyMuPDF, Markdown, and image processing
RUN python3 -m pip install --no-cache-dir pdf2docx pillow pymupdf pypdf python-docx fire markdown --break-system-packages 2>/dev/null || \
    python3 -m pip install --no-cache-dir pdf2docx pillow pymupdf pypdf python-docx fire markdown

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit

# Copy application source code
COPY . .

# Build Next.js production bundle
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID
ARG NEXT_PUBLIC_ADSENSE_TOP_SLOT
ARG NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT
ARG NEXT_PUBLIC_ANALYTICS_ID
ARG PUBLIC_SITE_URL

ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_ADSENSE_TOP_SLOT=$NEXT_PUBLIC_ADSENSE_TOP_SLOT
ENV NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT=$NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT
ENV NEXT_PUBLIC_ANALYTICS_ID=$NEXT_PUBLIC_ANALYTICS_ID
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Cloud Run execution port
EXPOSE 8080
ENV PORT=8080

CMD ["npm", "start"]
