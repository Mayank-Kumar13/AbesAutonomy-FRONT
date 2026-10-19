import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const BUCKET_NAME = 'pdfs';


/**
 * Check if Supabase client has valid, non-placeholder credentials
 */
export const isSupabaseConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return false;
  if (SUPABASE_URL.includes('your-project-ref')) return false;
  try {
    new URL(SUPABASE_URL);
    return true;
  } catch {
    return false;
  }
};

/**
 * Singleton Supabase client instance
 */
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Validate a file before upload
 * @param {File} file
 * @param {object} options
 */
export const validatePdfFile = (file, options = {}) => {
  const maxSize = options.maxSize || 25 * 1024 * 1024; // 25MB standard
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const isPdfType = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdfType) {
    return { valid: false, error: 'Only PDF documents (.pdf) are allowed.' };
  }

  if (file.size > maxSize) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const limitMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of ${limitMb} MB.`,
    };
  }

  return { valid: true };
};

/**
 * Upload a PDF file to the 'pdfs' bucket with unique path collision prevention
 * @param {File} file
 * @param {object} options
 * @returns {Promise<{path: string, url: string, name: string, size: number}>}
 */
export const uploadPdfToSupabase = async (file, options = {}) => {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please verify VITE_SUPABASE_URL in .env');
  }

  const validation = validatePdfFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Prevent accidental collisions with unique timestamp + random hash
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanBaseName = file.name
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 80);
  const uniqueFileName = `${cleanBaseName}_${timestamp}_${randomSuffix}.pdf`;

  const folder = options.folder
    ? options.folder.replace(/^\/+|\/+$/g, '')
    : 'uploads';
  const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload PDF to Supabase Storage');
  }

  // Retrieve public or signed URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: publicUrlData?.publicUrl || '',
    name: file.name,
    size: file.size,
  };
};

/**
 * List files in the 'pdfs' bucket with pagination and search
 * @param {string} folder
 * @param {object} options
 */
export const listSupabasePdfs = async (folder = '', options = {}) => {
  if (!supabase) {
    return { files: [], count: 0, configured: false };
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const sortBy = options.sortBy || { column: 'created_at', order: 'desc' };
  const search = options.search || '';

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(cleanFolder, {
      limit,
      offset,
      sortBy,
      search,
    });

  if (error) {
    throw new Error(error.message || 'Failed to list PDFs from Supabase Storage');
  }

  // Enrich with public URLs and normalized fields
  const files = (data || [])
    .filter((item) => item.name !== '.emptyFolderPlaceholder')
    .map((item) => {
      const itemPath = cleanFolder ? `${cleanFolder}/${item.name}` : item.name;
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(itemPath);

      return {
        ...item,
        path: itemPath,
        publicUrl: urlData?.publicUrl || '',
        isFolder: !item.metadata,
      };
    });

  return {
    files,
    configured: true,
  };
};

/**
 * Get direct public or signed URL for a file in Supabase
 * @param {string} filePath
 * @param {boolean} preferSigned
 * @param {number} expiresInSeconds
 */
export const getSupabasePdfUrl = async (filePath, preferSigned = false, expiresInSeconds = 3600) => {
  if (!supabase || !filePath) return '';

  const cleanPath = filePath.replace(/^\/+/, '');

  if (preferSigned) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cleanPath, expiresInSeconds);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch {
      // Fallback to public URL below
    }
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
  return data?.publicUrl || '';
};

/**
 * Download a PDF directly from Supabase Storage
 * @param {string} filePath
 * @param {string} customFilename
 */
export const downloadSupabasePdf = async (filePath, customFilename) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(cleanPath);

  if (error) {
    throw new Error(error.message || 'Failed to download file from Supabase Storage');
  }

  const filename = customFilename || cleanPath.split('/').pop() || 'document.pdf';
  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
};

/**
 * Delete a PDF from Supabase Storage
 * @param {string|string[]} filePaths
 */
export const deleteSupabasePdf = async (filePaths) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  const cleanPaths = paths.map((p) => p.replace(/^\/+/, ''));

  const { data, error } = await supabase.storage.from(BUCKET_NAME).remove(cleanPaths);
  if (error) {
    throw new Error(error.message || 'Failed to delete file from Supabase Storage');
  }
  return data;
};

export default supabase;
