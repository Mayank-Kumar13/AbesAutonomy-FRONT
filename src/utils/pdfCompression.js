import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// We need to set the worker source for pdfjs to work in browser environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Convert an image file (File or Blob) to an HTMLImageElement
 */
const fileToImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image File or converts it into a PDF
 * @param {File} file 
 * @param {number} quality (0.1 to 1.0)
 * @returns {Promise<File>} a PDF File object
 */
const compressImageToPdf = async (file, quality, originalName) => {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // Compress using canvas toDataURL
  const imgData = canvas.toDataURL('image/jpeg', quality);

  // Determine orientation based on dimensions
  const orientation = img.width > img.height ? 'l' : 'p';
  
  // A4 size in mm is roughly 210x297
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [img.width, img.height] // keep original image aspect ratio as page size
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, img.width, img.height);
  
  const pdfBlob = pdf.output('blob');
  
  // Return as a File object
  const filename = originalName.replace(/\.[^/.]+$/, "") + ".pdf";
  return new File([pdfBlob], filename, { type: 'application/pdf' });
};

/**
 * Reads an existing PDF, rasterizes each page, compresses the images, and creates a new PDF
 * @param {File} file 
 * @param {number} quality (0.1 to 1.0)
 * @returns {Promise<File>} a compressed PDF File object
 */
const compressExistingPdf = async (file, quality, originalName) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // We'll initialize a new jsPDF instance (first page is auto-created, but we'll delete it or overwrite it)
  // Let's create it on the first loop to know the exact dimensions of page 1
  let pdf = null;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    
    // Scale controls the internal resolution of the rasterized canvas. 
    // Usually 1.5 to 2.0 gives good readability for text while allowing JPEG compression to shrink file size.
    // Quality slider will mostly affect the JPEG compression artifacts and size.
    const viewport = page.getViewport({ scale: 1.5 }); 
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    const imgData = canvas.toDataURL('image/jpeg', quality);

    const orientation = viewport.width > viewport.height ? 'l' : 'p';

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [viewport.width, viewport.height]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
    } else {
      pdf.addPage([viewport.width, viewport.height], orientation);
      pdf.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
    }
  }

  const pdfBlob = pdf.output('blob');
  return new File([pdfBlob], originalName, { type: 'application/pdf' });
};

/**
 * Main function exposed to the UI to handle any file
 * @param {File} file 
 * @param {number} quality (0.1 to 1.0)
 */
export const compressAndConvertToPdf = async (file, quality = 0.6) => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (!isImage && !isPdf) {
    throw new Error('Unsupported file type. Only Images and PDFs can be compressed/converted.');
  }

  if (isImage) {
    return await compressImageToPdf(file, quality, file.name);
  } else {
    return await compressExistingPdf(file, quality, file.name);
  }
};
