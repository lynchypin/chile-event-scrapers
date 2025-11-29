import { logger } from './logger.js';

export async function extractImageInfo(page, imageUrl) {
  if (!imageUrl) return null;
  
  try {
    const info = await page.evaluate(async (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspect_ratio: img.naturalWidth / img.naturalHeight,
            pixel_density: window.devicePixelRatio || 1
          });
        };
        img.onerror = () => {
          resolve({ url, width: null, height: null, aspect_ratio: null, pixel_density: 1 });
        };
        img.src = url;
        
        setTimeout(() => {
          resolve({ url, width: null, height: null, aspect_ratio: null, pixel_density: 1 });
        }, 5000);
      });
    }, imageUrl);
    
    return info;
  } catch (error) {
    logger.debug(`Failed to extract image info for ${imageUrl}`, { error: error.message });
    return { url: imageUrl, width: null, height: null, aspect_ratio: null, pixel_density: 1 };
  }
}

export async function extractAllImages(page, selectors = ['img']) {
  const images = [];
  
  for (const selector of selectors) {
    try {
      const imgElements = await page.$$(selector);
      
      for (const img of imgElements) {
        const src = await img.getAttribute('src');
        const srcset = await img.getAttribute('srcset');
        const dataSrc = await img.getAttribute('data-src');
        const alt = await img.getAttribute('alt');
        
        const imageUrl = src || dataSrc;
        if (!imageUrl || imageUrl.startsWith('data:')) continue;
        
        if (isPlaceholderImage(imageUrl)) continue;
        
        const info = await extractImageInfo(page, imageUrl);
        
        if (info) {
          images.push({
            ...info,
            alt: alt || null,
            srcset: srcset || null,
            is_primary: images.length === 0
          });
        }
      }
    } catch (error) {
      logger.debug(`Error extracting images with selector ${selector}`, { error: error.message });
    }
  }
  
  return images;
}

export function isPlaceholderImage(url) {
  if (!url) return true;
  
  const placeholderPatterns = [
    /placeholder/i,
    /no-image/i,
    /default-image/i,
    /fallback/i,
    /loading/i,
    /spinner/i,
    /grey\.gif/i,
    /blank\.gif/i,
    /1x1/i,
    /pixel\.gif/i,
    /spacer/i
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(url));
}

export function isHighQualityImage(imageInfo, minWidth = 400, minHeight = 300) {
  if (!imageInfo || !imageInfo.width || !imageInfo.height) return false;
  return imageInfo.width >= minWidth && imageInfo.height >= minHeight;
}

export function selectBestImage(images) {
  if (!images || images.length === 0) return null;
  
  const validImages = images.filter(img => 
    img.width && img.height && 
    img.width >= 200 && img.height >= 150 &&
    !isPlaceholderImage(img.url)
  );
  
  if (validImages.length === 0) {
    return images[0];
  }
  
  validImages.sort((a, b) => {
    const aPixels = (a.width || 0) * (a.height || 0);
    const bPixels = (b.width || 0) * (b.height || 0);
    return bPixels - aPixels;
  });
  
  return validImages[0];
}

export function parseSrcset(srcset) {
  if (!srcset) return [];
  
  return srcset.split(',').map(entry => {
    const parts = entry.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '1x';
    
    let width = null;
    let density = 1;
    
    if (descriptor.endsWith('w')) {
      width = parseInt(descriptor);
    } else if (descriptor.endsWith('x')) {
      density = parseFloat(descriptor);
    }
    
    return { url, width, density };
  });
}
