import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// We need to set the worker source for pdfjs to work in browser environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

const findOptimalQuality = (canvas, targetSizeKb) => {
  if (!targetSizeKb) return canvas.toDataURL('image/jpeg', 0.6); // default

  let minQ = 0.05;
  let maxQ = 1.0;
  let bestDiff = Infinity;
  let bestData = null;

  for (let i = 0; i < 7; i++) {
    const q = (minQ + maxQ) / 2;
    const data = canvas.toDataURL('image/jpeg', q);
    // Rough estimation of JPEG size from Base64
    const sizeKb = (data.length * 0.75) / 1024;
    
    const diff = Math.abs(sizeKb - targetSizeKb);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestData = data;
    }

    // Add a tiny bit of overhead for PDF structure
    if (sizeKb * 1.05 > targetSizeKb) {
      maxQ = q;
    } else {
      minQ = q;
    }
  }
  return bestData;
};

const compressImage = async (file, targetSizeKb, originalName) => {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // If a target size is given, it's for the whole file
  const imgData = findOptimalQuality(canvas, targetSizeKb);
  
  // Convert Data URL to Blob
  const res = await fetch(imgData);
  const blob = await res.blob();
  
  return new File([blob], originalName, { type: 'image/jpeg' });
};

const compressExistingPdf = async (file, targetSizeKb, originalName) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let pdf = null;
  // Distribute the target size evenly across all pages, minus ~5% for PDF metadata overhead
  const targetPageSizeKb = targetSizeKb ? (targetSizeKb * 0.95) / pdfDocument.numPages : null;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    
    // Maintain a good scale for reading while letting JPEG handle the file size
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
    
    const imgData = findOptimalQuality(canvas, targetPageSizeKb);
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

export const compressAndConvertToPdf = async (file, targetSizeKb = null) => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (!isImage && !isPdf) {
    // For Word, Excel, etc., we cannot compress them in the browser.
    // Just return the original file to be uploaded as-is.
    return file;
  }

  if (isImage) {
    return await compressImage(file, targetSizeKb, file.name);
  } else {
    return await compressExistingPdf(file, targetSizeKb, file.name);
  }
};
