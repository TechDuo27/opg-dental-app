// lib/imageUtils.ts
/**
 * Utility functions for image processing
 */

/**
 * Resizes an image file if it exceeds the specified dimensions or size
 * @param file The image file to resize
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param maxSizeBytes Maximum file size in bytes
 * @returns A promise that resolves to the resized file
 */
export const resizeImageIfNeeded = async (
  file: File, 
  maxWidth = 1920, 
  maxHeight = 1080,
  maxSizeBytes = 2 * 1024 * 1024 // 2MB default
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is small enough, return it as is
    if (file.size <= maxSizeBytes) {
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Only resize if image is larger than max dimensions or size limit
        if (img.width <= maxWidth && img.height <= maxHeight && file.size <= maxSizeBytes) {
          return resolve(file);
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        let newWidth = img.width;
        let newHeight = img.height;
        
        if (newWidth > maxWidth) {
          newHeight = Math.round((newHeight * maxWidth) / newWidth);
          newWidth = maxWidth;
        }
        
        if (newHeight > maxHeight) {
          newWidth = Math.round((newWidth * maxHeight) / newHeight);
          newHeight = maxHeight;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to blob with reduced quality for JPEGs
        const quality = file.type === 'image/jpeg' ? 0.85 : 0.9;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob conversion failed'));
            }
            
            // Create new file from blob
            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            console.log(`Resized image from ${img.width}x${img.height} (${Math.round(file.size/1024)}KB) to ${newWidth}x${newHeight} (${Math.round(newFile.size/1024)}KB)`);
            resolve(newFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Safely handles base64 image data to prevent memory issues
 * @param base64Data The base64 image data
 * @param maxLength Maximum allowed length for the base64 string
 * @returns The original base64 data if it's within limits, or null if it's too large
 */
export const safelyHandleBase64Image = (base64Data: string | null, maxLength = 1024 * 1024): string | null => {
  if (!base64Data) return null;
  
  try {
    // Check if the base64 string is too large
    if (base64Data.length > maxLength) {
      console.warn(`Base64 image data too large (${Math.round(base64Data.length/1024)}KB), exceeds limit of ${Math.round(maxLength/1024)}KB`);
      return null;
    }
    
    return base64Data;
  } catch (error) {
    console.error('Error handling base64 image:', error);
    return null;
  }
};