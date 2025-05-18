import { doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Initializes the locations collection with sample data for the live Firebase
 * This function checks for each location individually and only adds missing ones
 * @returns {Promise<void>}
 */
export const initializeLocations = async () => {
  try {
    // Sample locations data
    const locationsData = [
      {
        id: "USN-Vestfold",
        name: "USN - Campus Vestfold",
        image: "/images/USN-Vestfold.jpg",
        zones: ["alimento", "amfi"],
        zoneMaps: {
          alimento: "/images/alimento-map.png",
          amfi: "/images/amfi-map.jpeg",
        },
      },
      {
        id: "USN-Drammen",
        name: "USN - Campus Drammen",
        image: "/images/USN-Drammen.jpg",
        zones: ["cafeteria", "library"],
        zoneMaps: {
          cafeteria: "/images/drammen-cafeteria-map.png",
          library: "/images/drammen-library-map.png",
        },
      },
      {
        id: "USN-Ringerike",
        name: "USN - Campus Ringerike",
        image: "/images/USN-Ringerike.jpg",
        zones: ["main", "annex"],
        zoneMaps: {
          main: "/images/ringerike-main-map.png",
          annex: "/images/ringerike-annex-map.png",
        },
      },
      {
        id: "USN-Bo",
        name: "USN - Campus Bø",
        image: "/images/USN-Bo.jpg",
        zones: ["canteen", "student-area"],
        zoneMaps: {
          canteen: "/images/bo-canteen-map.png",
          "student-area": "/images/bo-student-area-map.png",
        },
      },
    ];

    // Check each location individually and add if missing
    for (const location of locationsData) {
      const { id, ...locationData } = location;
      const locationRef = doc(db, "locations", id);
      const locationDoc = await getDoc(locationRef);

      if (!locationDoc.exists()) {
        await setDoc(locationRef, locationData);
        console.log(`Added location: ${location.name}`);
      } else {
        console.log(`Location already exists: ${location.name}`);
      }
    }

    console.log("Locations initialization check completed");
  } catch (error) {
    console.error("Error initializing locations:", error);
  }
};
