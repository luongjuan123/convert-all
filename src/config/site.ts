export const siteConfig = {
  name: "Universal File Converter",
  domain: process.env.PUBLIC_SITE_URL || "https://convertall-site.web.app",
  description: "Fast, simple, secure, and private online file conversion. Convert PDF, Image, Video, Audio, and Office documents instantly for free.",
  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || process.env.MAX_UPLOAD_SIZE || "2147483648", 10), // 2GB default (2,147,483,648 bytes)
  largeFileThresholdBytes: parseInt(process.env.LARGE_FILE_THRESHOLD_BYTES || "524288000", 10), // 500MB
  fileExpirationMinutes: parseInt(process.env.FILE_EXPIRATION_MINUTES || "60", 10), // 1 hour
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || "4", 10),
  maxLargeConcurrentJobs: parseInt(process.env.MAX_LARGE_CONCURRENT_JOBS || "1", 10),
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID || "",
};

export interface ToolDefinition {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  category: "pdf" | "image" | "video" | "audio" | "office";
  iconName: string;
  inputExtensions: string[];
  defaultOutput: string;
  popular?: boolean;
  shortDescription: string;
  howItWorks: string[];
  faq: Array<{ question: string; answer: string }>;
}

export const TOOLS_LIST: ToolDefinition[] = [
  {
    slug: "pdf-to-word",
    title: "PDF to Word (DOCX)",
    metaTitle: "PDF to Word Converter – Convert PDF to DOCX Free Online",
    metaDescription: "Convert PDF files to editable Word documents (DOCX) online. Fast, free, accurate, and private. No sign-up required.",
    h1: "Convert PDF to Word (DOCX) Online",
    category: "pdf",
    iconName: "FileText",
    inputExtensions: [".pdf"],
    defaultOutput: "docx",
    popular: true,
    shortDescription: "Convert PDF documents to editable Microsoft Word files while preserving document structure and layout.",
    howItWorks: [
      "Upload your PDF document to the dropzone above.",
      "Click 'Convert to DOCX' to process the file.",
      "Download your editable Word document immediately."
    ],
    faq: [
      { question: "Is PDF to Word conversion free?", answer: "Yes, 100% free with no hidden charges, registration, or file limits." },
      { question: "Will my PDF layout be preserved?", answer: "Our conversion engine maintains headers, text layout, and formatting as closely as possible." },
      { question: "Are my files safe?", answer: "All uploaded and converted files are automatically destroyed from our servers within 1 hour." }
    ]
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    metaTitle: "Word to PDF Converter – Convert DOCX/DOC to PDF Online",
    metaDescription: "Convert Microsoft Word files (DOCX, DOC) to PDF instantly. High-quality document conversion with no account required.",
    h1: "Convert Word (DOCX/DOC) to PDF Online",
    category: "office",
    iconName: "FileCheck",
    inputExtensions: [".docx", ".doc"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Transform Word documents into pristine PDF files readable on all devices.",
    howItWorks: [
      "Select or drag your DOCX or DOC file into the box.",
      "Click 'Convert to PDF'.",
      "Download your polished PDF file."
    ],
    faq: [
      { question: "Does Word to PDF preserve fonts?", answer: "Yes, document formatting and fonts are rendered standard to PDF specifications." }
    ]
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    metaTitle: "PDF to JPG Converter – Extract PDF Pages to JPG Images",
    metaDescription: "Convert PDF pages into high-resolution JPG images free. Fast online rendering with no installation needed.",
    h1: "Convert PDF to JPG Images Online",
    category: "pdf",
    iconName: "Image",
    inputExtensions: [".pdf"],
    defaultOutput: "jpg",
    popular: true,
    shortDescription: "Extract PDF pages or render whole documents as crisp JPG image files.",
    howItWorks: [
      "Upload your PDF file.",
      "Choose JPG image output format.",
      "Download your converted JPG image files."
    ],
    faq: [
      { question: "Can I convert multi-page PDFs to images?", answer: "Yes, multi-page PDFs can be extracted page-by-page or bundled." }
    ]
  },
  {
    slug: "pdf-to-png",
    title: "PDF to PNG",
    metaTitle: "PDF to PNG Converter – High Quality Image Extraction",
    metaDescription: "Convert PDF files to transparent or lossless PNG images online. Free and secure online converter.",
    h1: "Convert PDF to PNG Images Online",
    category: "pdf",
    iconName: "Image",
    inputExtensions: [".pdf"],
    defaultOutput: "png",
    shortDescription: "Render PDF document pages as high-quality PNG image files.",
    howItWorks: [
      "Drop your PDF file into the converter.",
      "Click Convert to PNG.",
      "Save your PNG files instantly."
    ],
    faq: []
  },
  {
    slug: "pdf-to-txt",
    title: "PDF to Text",
    metaTitle: "PDF to Text Converter – Extract Text from PDF",
    metaDescription: "Extract raw plain text from PDF documents quickly and easily. Free online PDF text extractor.",
    h1: "Extract Text from PDF Documents",
    category: "pdf",
    iconName: "FileCode",
    inputExtensions: [".pdf"],
    defaultOutput: "txt",
    shortDescription: "Pull plain text out of PDF files for quick editing or data extraction.",
    howItWorks: [
      "Upload your PDF document.",
      "Extract text content into plain TXT format.",
      "Copy or download text file."
    ],
    faq: []
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    metaTitle: "JPG to PDF Converter – Convert Images to PDF Online",
    metaDescription: "Convert JPG and JPEG photos into a clean PDF document. Easy, fast, and completely free online.",
    h1: "Convert JPG Images to PDF Document",
    category: "image",
    iconName: "FileDigit",
    inputExtensions: [".jpg", ".jpeg"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Bundle JPG images into a clean, ready-to-share PDF file.",
    howItWorks: [
      "Select JPG photos to convert.",
      "Click Convert to PDF.",
      "Download your generated PDF."
    ],
    faq: []
  },
  {
    slug: "png-to-pdf",
    title: "PNG to PDF",
    metaTitle: "PNG to PDF Converter – Convert PNG Pictures to PDF",
    metaDescription: "Turn PNG pictures and graphics into a high-res PDF file. Free online image to PDF tool.",
    h1: "Convert PNG Pictures to PDF",
    category: "image",
    iconName: "FileDigit",
    inputExtensions: [".png"],
    defaultOutput: "pdf",
    shortDescription: "Easily merge or convert PNG image files into a single PDF.",
    howItWorks: [
      "Upload PNG file.",
      "Generate PDF document.",
      "Download result."
    ],
    faq: []
  },
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    metaTitle: "Merge PDF Files Online – Combine PDFs into One Document",
    metaDescription: "Combine multiple PDF documents into a single PDF file online. Fast, secure, and free PDF joiner.",
    h1: "Combine & Merge PDF Files Online",
    category: "pdf",
    iconName: "Combine",
    inputExtensions: [".pdf"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Join multiple PDF files into one organized document in seconds.",
    howItWorks: [
      "Upload two or more PDF files.",
      "Click Merge PDF.",
      "Download your combined PDF document."
    ],
    faq: [
      { question: "Is there a limit on how many PDFs I can merge?", answer: "You can merge multiple PDFs up to 200MB total size per request." }
    ]
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    metaTitle: "Split PDF Online – Separate PDF Pages or Extract Range",
    metaDescription: "Split PDF pages into separate files or extract specific page ranges for free.",
    h1: "Split PDF Pages into Separate Files",
    category: "pdf",
    iconName: "Scissors",
    inputExtensions: [".pdf"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Separate PDF pages or extract page ranges into new PDF files.",
    howItWorks: [
      "Upload your PDF document.",
      "Specify page ranges or split single pages.",
      "Download your split PDF file."
    ],
    faq: []
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    metaTitle: "Compress PDF Online – Reduce PDF File Size Free",
    metaDescription: "Reduce the file size of PDF documents while maintaining optimal visual quality. Free online PDF shrink tool.",
    h1: "Reduce & Compress PDF File Size",
    category: "pdf",
    iconName: "Minimize2",
    inputExtensions: [".pdf"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Shrink bloated PDF documents for easy email attachment and sharing.",
    howItWorks: [
      "Select your PDF file.",
      "Click Compress PDF.",
      "Download your optimized small PDF."
    ],
    faq: []
  },
  {
    slug: "jpg-to-png",
    title: "JPG to PNG",
    metaTitle: "JPG to PNG Converter – Convert Images Online Free",
    metaDescription: "Convert JPG images to transparent PNG format quickly. Free online image format converter.",
    h1: "Convert JPG Images to PNG Format",
    category: "image",
    iconName: "Image",
    inputExtensions: [".jpg", ".jpeg"],
    defaultOutput: "png",
    popular: true,
    shortDescription: "Convert JPEG pictures into uncompressed or lossless PNG image files.",
    howItWorks: [
      "Upload JPG image.",
      "Click Convert to PNG.",
      "Download PNG file."
    ],
    faq: []
  },
  {
    slug: "png-to-jpg",
    title: "PNG to JPG",
    metaTitle: "PNG to JPG Converter – Turn PNG into JPEG Image",
    metaDescription: "Convert PNG pictures into small, web-friendly JPG photos free.",
    h1: "Convert PNG Images to JPG Format",
    category: "image",
    iconName: "Image",
    inputExtensions: [".png"],
    defaultOutput: "jpg",
    popular: true,
    shortDescription: "Transform PNG graphics into compressed JPG photos for web use.",
    howItWorks: [
      "Select your PNG image.",
      "Convert to JPG format.",
      "Download the JPG result."
    ],
    faq: []
  },
  {
    slug: "webp-to-jpg",
    title: "WEBP to JPG",
    metaTitle: "WEBP to JPG Converter – Convert WebP Images Free",
    metaDescription: "Convert modern WEBP images to universal JPG format online.",
    h1: "Convert WEBP Images to JPG Online",
    category: "image",
    iconName: "Image",
    inputExtensions: [".webp"],
    defaultOutput: "jpg",
    popular: true,
    shortDescription: "Convert modern WEBP browser graphics into standard JPG images.",
    howItWorks: [
      "Upload WEBP image.",
      "Convert to JPG.",
      "Download converted file."
    ],
    faq: []
  },
  {
    slug: "heic-to-jpg",
    title: "HEIC to JPG",
    metaTitle: "HEIC to JPG Converter – Convert iPhone Photos to JPG",
    metaDescription: "Convert Apple HEIC / HEIF iPhone photos to standard JPG format online free.",
    h1: "Convert HEIC iPhone Photos to JPG",
    category: "image",
    iconName: "Smartphone",
    inputExtensions: [".heic", ".heif"],
    defaultOutput: "jpg",
    popular: true,
    shortDescription: "Convert Apple iPhone HEIC pictures to widely compatible JPG format.",
    howItWorks: [
      "Upload HEIC photos from your iPhone or iPad.",
      "Click Convert to JPG.",
      "Download universal JPG images."
    ],
    faq: [
      { question: "Why convert HEIC to JPG?", answer: "JPG works everywhere on Windows, Android, TV, and web browsers." }
    ]
  },
  {
    slug: "mp4-to-mp3",
    title: "MP4 to MP3",
    metaTitle: "MP4 to MP3 Converter – Extract Audio from Video Online",
    metaDescription: "Extract high-quality MP3 audio from MP4 video files free online. No registration required.",
    h1: "Extract MP3 Audio from MP4 Video",
    category: "video",
    iconName: "Music",
    inputExtensions: [".mp4"],
    defaultOutput: "mp3",
    popular: true,
    shortDescription: "Extract audio tracks from MP4 video files into high bitrate MP3 music files.",
    howItWorks: [
      "Upload your MP4 video file.",
      "Choose audio bitrate (e.g. 320 kbps, 256 kbps, 192 kbps).",
      "Download your MP3 audio."
    ],
    faq: []
  },
  {
    slug: "mov-to-mp4",
    title: "MOV to MP4",
    metaTitle: "MOV to MP4 Converter – Convert QuickTime Video to MP4",
    metaDescription: "Convert QuickTime MOV videos into universal MP4 files free online.",
    h1: "Convert MOV QuickTime Videos to MP4",
    category: "video",
    iconName: "Video",
    inputExtensions: [".mov"],
    defaultOutput: "mp4",
    popular: true,
    shortDescription: "Turn QuickTime MOV video clips from Mac/iPhone into compatible MP4 format.",
    howItWorks: [
      "Upload your MOV video clip.",
      "Convert to MP4.",
      "Download your MP4 file."
    ],
    faq: []
  },
  {
    slug: "webm-to-mp4",
    title: "WEBM to MP4",
    metaTitle: "WEBM to MP4 Converter – Convert Web Videos Free",
    metaDescription: "Convert WEBM web video recordings into standard MP4 format online.",
    h1: "Convert WEBM Video Files to MP4",
    category: "video",
    iconName: "Video",
    inputExtensions: [".webm"],
    defaultOutput: "mp4",
    shortDescription: "Convert web recordings or WEBM video files into MP4 format.",
    howItWorks: [
      "Upload WEBM video file.",
      "Convert to MP4 format.",
      "Download MP4 video."
    ],
    faq: []
  },
  {
    slug: "wav-to-mp3",
    title: "WAV to MP3",
    metaTitle: "WAV to MP3 Converter – Compress Audio Files Online",
    metaDescription: "Compress uncompressed WAV audio files into high quality MP3 format online.",
    h1: "Convert WAV Audio Files to MP3",
    category: "audio",
    iconName: "Music",
    inputExtensions: [".wav"],
    defaultOutput: "mp3",
    popular: true,
    shortDescription: "Reduce large uncompressed WAV sound files into compressed MP3 audio.",
    howItWorks: [
      "Upload WAV audio.",
      "Select desired MP3 bitrate.",
      "Download compressed MP3."
    ],
    faq: []
  },
  {
    slug: "compress-video",
    title: "Compress Video",
    metaTitle: "Compress Video Online – Reduce MP4/MOV Video Size",
    metaDescription: "Reduce video file size online while keeping clear visual quality. Shrink MP4, MOV, WEBM videos.",
    h1: "Reduce Video File Size Online",
    category: "video",
    iconName: "Video",
    inputExtensions: [".mp4", ".mov", ".webm", ".avi", ".mkv"],
    defaultOutput: "mp4",
    popular: true,
    shortDescription: "Compress large video files for email, messaging apps, or website upload.",
    howItWorks: [
      "Select video file to shrink.",
      "Choose compression preset (Maximum Quality, Balanced, Small File).",
      "Download compressed video."
    ],
    faq: []
  },
  {
    slug: "compress-image",
    title: "Compress Image",
    metaTitle: "Compress Image Online – Reduce JPG/PNG/WEBP Size",
    metaDescription: "Compress images online without losing visible quality. Optimize JPG, PNG, and WEBP pictures.",
    h1: "Compress Images Online for Free",
    category: "image",
    iconName: "Image",
    inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    defaultOutput: "jpg",
    popular: true,
    shortDescription: "Optimize and shrink JPG, PNG, and WEBP pictures for faster web load times.",
    howItWorks: [
      "Upload image file.",
      "Adjust quality level.",
      "Download optimized compressed image."
    ],
    faq: []
  },
  {
    slug: "pptx-to-pdf",
    title: "PPTX to PDF",
    metaTitle: "PPTX to PDF Converter – Convert PowerPoint to PDF Online",
    metaDescription: "Convert PowerPoint presentations (PPTX, PPT) to PDF documents free online.",
    h1: "Convert PowerPoint (PPTX/PPT) to PDF",
    category: "office",
    iconName: "Presentation",
    inputExtensions: [".pptx", ".ppt"],
    defaultOutput: "pdf",
    shortDescription: "Turn PowerPoint presentation slides into crisp PDF documents.",
    howItWorks: [
      "Upload PPTX or PPT file.",
      "Click Convert to PDF.",
      "Download converted PDF slides."
    ],
    faq: []
  },
  {
    slug: "xlsx-to-pdf",
    title: "XLSX to PDF",
    metaTitle: "XLSX to PDF Converter – Convert Excel to PDF Online",
    metaDescription: "Convert Excel spreadsheets (XLSX, XLS) to PDF documents quickly and free.",
    h1: "Convert Excel Spreadsheets (XLSX/XLS) to PDF",
    category: "office",
    iconName: "Table",
    inputExtensions: [".xlsx", ".xls"],
    defaultOutput: "pdf",
    shortDescription: "Convert Excel worksheets into printable PDF tables.",
    howItWorks: [
      "Upload Excel file.",
      "Convert to PDF.",
      "Download PDF document."
    ],
    faq: []
  }
];
