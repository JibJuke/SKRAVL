/**
 * Utility functions for consistent formatting across the app
 *
 * Validates and formats a date for display
 * Handles various date inputs: Date objects, Firestore timestamps, ISO strings, etc.
 *
 * @param {Date|Object|string} dateInput - The date to format
 * @param {string} defaultValue - Value to return if date is invalid
 * @returns {string} Formatted date string or default value
 */
export const formatDate = (dateInput, defaultValue = "Unknown date") => {
  try {
    // Handle null/undefined
    if (!dateInput) return defaultValue;

    let date;

    // Handle Firestore timestamp objects (which have toDate method)
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      date = dateInput.toDate();
    }
    // Handle ISO strings
    else if (typeof dateInput === "string") {
      date = new Date(dateInput);
    }
    // Handle Date objects or timestamps
    else if (
      dateInput instanceof Date ||
      typeof dateInput.getTime === "function"
    ) {
      date = dateInput;
    }
    // Handle objects with seconds and nanoseconds (Firestore server timestamp)
    else if (dateInput.seconds !== undefined) {
      date = new Date(dateInput.seconds * 1000);
    }

    // Check if date is valid before formatting
    if (isNaN(date) || !date.getTime || isNaN(date.getTime())) {
      return defaultValue;
    }

    // Format as locale date string
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error, dateInput);
    return defaultValue;
  }
};
