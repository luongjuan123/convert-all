export const siteConfig = {
  name: "Universal File Converter",
  domain: process.env.PUBLIC_SITE_URL || "https://convertall.site",
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
      { question: "Does Word to PDF preserve formatting and fonts?", answer: "Yes, document layout, margins, and embedded styles are accurately rendered to standard PDF specifications." },
      { question: "Is Word to PDF conversion free?", answer: "Yes, you can convert unlimited DOC and DOCX documents with no fees or subscription." },
      { question: "Are my converted Word files private?", answer: "All uploaded and processed documents are automatically and permanently deleted from our servers within 1 hour." }
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
      { question: "Can I convert multi-page PDFs to images?", answer: "Yes, each page of your PDF document is rendered into high-resolution JPG images available for individual or batch download." },
      { question: "What resolution are the extracted JPGs?", answer: "Pages are rendered at high DPI (150-300 DPI) ensuring crisp text and sharp image clarity." },
      { question: "Will my confidential PDF remain secure?", answer: "Your uploaded PDF files are processed securely in an isolated sandbox and deleted within 60 minutes." }
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
    faq: [
      { question: "Why choose PNG over JPG for PDF extraction?", answer: "PNG provides lossless image compression and supports transparency, making it ideal for diagrams, charts, and vector text." },
      { question: "Can I convert large PDFs to PNG?", answer: "Yes, our converter supports multi-page PDF documents up to 200MB in size." },
      { question: "Do I need to install any software?", answer: "No software or plugins are needed. Everything runs directly in your web browser." }
    ]
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
    faq: [
      { question: "Can I extract text from scanned PDFs?", answer: "Our text extractor reads selectable digital text directly from PDF streams. For best results, use digital documents with embedded text." },
      { question: "Does extracting text keep formatting?", answer: "The output is clean, unformatted plain text (UTF-8), suitable for data analysis, code, or editing in any text editor." },
      { question: "Is there a limit on PDF page count?", answer: "You can extract text from documents with hundreds of pages without limitations." }
    ]
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
    faq: [
      { question: "Can I combine multiple JPG photos into one PDF?", answer: "Yes, you can upload multiple JPG photos and combine them into a single, polished PDF document." },
      { question: "Will image quality degrade when converting JPG to PDF?", answer: "No, image resolution and compression levels are preserved without re-compression degradation." },
      { question: "Is there a file size limit for image uploads?", answer: "You can convert image files up to 200MB quickly and securely." }
    ]
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
    faq: [
      { question: "Does PNG to PDF maintain transparency?", answer: "Transparent backgrounds in PNG images are rendered on clean white backgrounds standard for PDF documents." },
      { question: "Can I convert screenshots and infographics to PDF?", answer: "Yes, PNG screenshots and infographics convert to crystal-clear PDFs ideal for printing or emailing." },
      { question: "Are my uploaded photos kept private?", answer: "Files are transferred over HTTPS and permanently destroyed within 1 hour of processing." }
    ]
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
      { question: "Is there a limit on how many PDFs I can merge?", answer: "You can merge multiple PDFs up to 200MB total size per request." },
      { question: "Can I rearrange the order of pages when merging?", answer: "Files are merged in the sequence you upload them into a single unified document." },
      { question: "Does merging reduce document quality?", answer: "No, original vector text, vector graphics, and image quality are completely retained." }
    ]
  },
  {
    slug: "markdown-to-pdf",
    title: "Markdown to PDF",
    metaTitle: "Convert Markdown to PDF Online – Fast MD to PDF Converter",
    metaDescription: "Convert Markdown (.md, .markdown) files into professionally formatted PDF documents online for free. Full support for tables, code blocks, and Unicode.",
    h1: "Convert Markdown to Beautiful PDF Online",
    category: "pdf",
    iconName: "FileText",
    inputExtensions: [".md", ".markdown"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Transform Markdown notes and technical documentation into elegant, publication-ready PDF files with full styling.",
    howItWorks: [
      "Upload your Markdown (.md or .markdown) file.",
      "The converter styles headings, tables, code blocks, and typography.",
      "Download your high-resolution, formatted PDF document."
    ],
    faq: [
      { question: "Does Markdown to PDF preserve code blocks and syntax formatting?", answer: "Yes, code blocks are rendered in distinctive monospaced typography with background highlighting and automatic line wrapping." },
      { question: "Can I convert Markdown tables into formatted PDF tables?", answer: "Yes, Markdown tables are styled with crisp borders, clear headers, and responsive margins that fit standard page layouts." },
      { question: "Does the converter support international characters and Vietnamese accents?", answer: "Yes, full UTF-8 Unicode is supported, ensuring Vietnamese diacritics, Asian scripts, and accents render with complete clarity." }
    ]
  },
  {
    slug: "images-to-pdf",
    title: "Images to PDF",
    metaTitle: "Convert Images to PDF Online – Combine Photos into One PDF",
    metaDescription: "Combine multiple images (JPG, PNG, WebP) into a single PDF document online. Maintain original quality, custom order, and automatic orientation.",
    h1: "Combine Multiple Images into One PDF Online",
    category: "pdf",
    iconName: "Images",
    inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    defaultOutput: "pdf",
    popular: true,
    shortDescription: "Merge multiple photos and screenshots into a single organized PDF document in your exact preferred order.",
    howItWorks: [
      "Upload multiple JPG, PNG, or WebP images.",
      "Arrange photos in your desired sequence with one-click reordering.",
      "Download your unified, multi-page PDF document."
    ],
    faq: [
      { question: "Can I rearrange the order of images before generating the PDF?", answer: "Yes, you can easily move images up or down to set the exact page sequence in the output PDF." },
      { question: "Does the converter fix photos taken vertically on smartphones?", answer: "Yes, camera and smartphone EXIF orientation data is automatically detected and corrected so no photos appear sideways." },
      { question: "Will my images be distorted or stretched on the PDF page?", answer: "No, each image maintains its exact aspect ratio centered neatly within standard page margins." }
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
    faq: [
      { question: "How do I split specific pages from a PDF?", answer: "You can extract individual pages or specific page numbers into separate PDF documents." },
      { question: "Can I extract a single page from a large book or report?", answer: "Yes, easily extract any single page into its own standalone PDF file." },
      { question: "Are my original PDF files modified?", answer: "Your source file remains untouched; a new PDF is generated containing only your chosen pages." }
    ]
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
    faq: [
      { question: "How much can I reduce my PDF file size?", answer: "Depending on the original images and fonts, PDF files can typically be reduced by 40% to 80%." },
      { question: "Will compression make text unreadable?", answer: "No, our smart compression optimizes vector streams and downsamples high-res images while keeping text razor-sharp." },
      { question: "Is PDF compression safe for sensitive documents?", answer: "Yes, all processing occurs on secure temporary cloud instances with zero human inspection." }
    ]
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
    faq: [
      { question: "Why convert JPG to PNG?", answer: "PNG is a lossless format ideal for graphics, web assets, and iterative editing where lossy compression artifacts must be avoided." },
      { question: "Does converting JPG to PNG improve quality?", answer: "While it cannot restore lost data from JPG compression, it prevents any further quality loss during editing." },
      { question: "Is the conversion instant?", answer: "Yes, most image conversions complete in under two seconds." }
    ]
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
    faq: [
      { question: "Why convert PNG to JPG?", answer: "JPG files have significantly smaller file sizes than PNGs, making them much faster to upload, email, and share." },
      { question: "What happens to transparent backgrounds?", answer: "Transparent areas in PNG files are automatically rendered on a clean white background in the resulting JPG." },
      { question: "Can I adjust compression levels?", answer: "Our engine balances maximum visual fidelity with minimal file size." }
    ]
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
    faq: [
      { question: "What is WEBP and why convert to JPG?", answer: "WEBP is a modern web image format created by Google. Converting to JPG ensures compatibility with older image viewers, office suites, and printers." },
      { question: "Does WEBP to JPG conversion lose quality?", answer: "The conversion retains full visual detail and color accuracy." },
      { question: "Can I convert animated WEBP files?", answer: "Animated WEBP files will be converted into high-resolution JPG stills or frames." }
    ]
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
      { question: "Why convert HEIC to JPG?", answer: "JPG works everywhere on Windows, Android, TV, and web browsers." },
      { question: "Can I convert multiple HEIC photos at once?", answer: "Yes, you can upload and batch convert HEIC photos from your iPhone or iPad." },
      { question: "Are photo orientation and EXIF preserved?", answer: "Orientation metadata is preserved so your photos always appear right-side up." }
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
    faq: [
      { question: "Can I extract audio from any MP4 video?", answer: "Yes, our converter extracts audio tracks from any MP4 video file and encodes them into clean MP3 files." },
      { question: "What audio bitrate is used for the MP3?", answer: "Audio is encoded in high-quality 192kbps - 320kbps MP3 format for crystal-clear sound reproduction." },
      { question: "How fast is video-to-audio extraction?", answer: "Audio demuxing and encoding is performed by high-speed serverless FFmpeg workers in just seconds." }
    ]
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
    faq: [
      { question: "Why should I convert MOV to MP4?", answer: "Apple QuickTime MOV files often fail to play on Windows, Linux, Android, and smart TVs. MP4 (H.264/AAC) is universally supported." },
      { question: "Will converting MOV to MP4 reduce video quality?", answer: "Our conversion engine maintains source video resolution and frame rate while ensuring universal codec compatibility." },
      { question: "What is the maximum MOV file size supported?", answer: "You can convert videos up to 2GB using our high-capacity conversion infrastructure." }
    ]
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
    faq: [
      { question: "Why convert WEBM to MP4?", answer: "WEBM is commonly used for browser screen recordings and HTML5 video, but MP4 is required for video editors, social media, and mobile devices." },
      { question: "Does audio stay synchronized?", answer: "Yes, audio and video tracks are accurately synced during container transcoding." },
      { question: "Is WEBM to MP4 free?", answer: "Yes, 100% free with no watermarks or restrictions." }
    ]
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
    faq: [
      { question: "Why convert WAV to MP3?", answer: "Uncompressed WAV audio files are massive (often 30MB-50MB per song). MP3 reduces file size by up to 90% while maintaining excellent listening quality." },
      { question: "Can I choose the MP3 bitrate?", answer: "The conversion applies industry-standard high-fidelity MP3 encoding suitable for music, podcasts, and voice memos." },
      { question: "Is audio fidelity lost?", answer: "The perceptual audio codec preserves all frequencies within the range of human hearing." }
    ]
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
    faq: [
      { question: "How does video compression work?", answer: "Our engine utilizes modern H.264 rate-control algorithms to compress video streams without visible artifacts." },
      { question: "How much can my video file size be reduced?", answer: "Videos can often be compressed by 50% to 70%, making them easy to send over email, WhatsApp, or Discord." },
      { question: "Does compression change video resolution?", answer: "You can keep original resolution or scale down for maximum size reduction." }
    ]
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
    faq: [
      { question: "Will image compression degrade visual quality?", answer: "We use visually lossless compression algorithms that remove redundant data without noticeable quality degradation." },
      { question: "Which image formats can be compressed?", answer: "You can compress JPG, PNG, and WEBP formats seamlessly." },
      { question: "How fast is image compression?", answer: "Most images are compressed in less than 1 second." }
    ]
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
    faq: [
      { question: "Why convert PowerPoint to PDF?", answer: "PDF guarantees that your presentation slides look identical on every screen without font mismatches or formatting shifts." },
      { question: "Are slide layouts and graphics preserved?", answer: "PDFs capture slide visuals, fonts, diagrams, and vector graphics accurately for printing or reading." },
      { question: "Is Microsoft Office required?", answer: "No, our cloud conversion engine handles PowerPoint files without requiring Office installed." }
    ]
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
    faq: [
      { question: "Why convert Excel spreadsheets to PDF?", answer: "Converting XLSX to PDF makes financial reports, invoices, and data tables printable and read-only, preventing accidental edits." },
      { question: "Does Excel to PDF keep table layouts?", answer: "Yes, gridlines, fonts, and cell formatting are rendered neatly into standard page margins." },
      { question: "Are formulas calculated in the PDF output?", answer: "All formulas are evaluated so the resulting PDF displays the final calculated values and cell formatting." }
    ]
  }
];
