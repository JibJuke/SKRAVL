# SKRAVL

A React Firebase web application built with Vite.

## How to see the app in action:

### Step 1. Clone the repository

Run the following command:

```bash
git clone <repository-url>
cd SKRAVL
```

### Step 2. Install dependencies

Run the following command:

```bash
npm install
```

### Step 3. Set up Firebase credentials

1. Rename the `.env-example` file to `.env`
2. Replace the placeholder values with the actual Firebase credentials from the FirebaseKeys.txt file you received personally.

```
# Example of how your .env file should look
VITE_FIREBASE_API_KEY=actual_key_from_firebasekeys_txt
VITE_FIREBASE_AUTH_DOMAIN=actual_domain_from_firebasekeys_txt
...etc
```

### Step 4. Run the application

Run the following command:

```bash
npm run dev
```

The application will open automatically at http://localhost:3000

### Step 5. Build for production (optional)

If you want to create a production build:

```bash
npm run build
npm run preview  # To preview the production build
```

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/styles` - CSS stylesheets
  - `/utils` - Utility functions
