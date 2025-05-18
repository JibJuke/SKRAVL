/**
 * Utility function to load images from either local public directory or remote URLs
 *
 * This helps with the transition from local development to production
 * If the image path starts with 'http', it will be used as is
 * Otherwise, it assumes a local path relative to the public directory
 *
 * @param {string} imagePath - The image path from the database
 * @returns {string} - The resolved image URL
 */
export const resolveImagePath = (imagePath) => {
  // If it's already a full URL, return as is
  if (
    imagePath &&
    (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
  ) {
    return imagePath;
  }

  // If it's a relative path, resolve it relative to the public directory
  // In development, this will point to the local public directory
  // In production, this should point to your hosting root
  return imagePath;
};

/**
 * Preloads an array of images to ensure they're cached by the browser
 * @param {string[]} imagePaths - Array of image paths to preload
 * @returns {Promise<void>} - Resolves when all images are loaded
 */
export const preloadImages = async (imagePaths) => {
  const promises = imagePaths.map((path) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = resolveImagePath(path);
      img.onload = resolve;
      img.onerror = reject;
    });
  });

  try {
    await Promise.all(promises);
    console.log("All images preloaded successfully");
  } catch (error) {
    console.error("Error preloading images:", error);
  }
};
