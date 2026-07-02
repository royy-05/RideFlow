# RideFlow 🚗⚡

RideFlow is a modern, premium MERN (MongoDB, Express, React, Node.js) stack ride-sharing application featuring real-time driver tracking, distance-based fare calculations, dynamic surge pricing, and live passenger-driver chat.

---

## 🌟 Key Features

* **Real-time Map Integration**: Geolocation markers, interactive pick-up/drop-off autocomplete, and route paths rendered via Google Maps APIs.
* **MERN Architecture**: Clean separation of frontend built with **Vite React** and backend powered by **Express.js** and **Mongoose**.
* **Driver Dispatch Matching**: Automatic geospatial searching (`$near` index) to match ride requests to the closest active, online driver.
* **WebSocket Real-time Synchronization**: Powered by **Socket.io** to enable instant ride requests, driver status transitions, driver location updates, and message logs.
* **Live Chat**: Dual-socket chat channels synchronizing messaging between passenger and driver.
* **Earnings Dashboard**: Driver analytics compiling total earnings, rides finished, and trip history.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), TailwindCSS, Google Maps API (`@react-google-maps/api`), Socket.io-client, Axios.
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JSON Web Tokens (JWT), BcryptJS.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory for the frontend, and a `.env` file inside the `server/` directory for the backend.

### 1. Frontend Configuration (`/.env`)
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_API_URL=http://localhost:5000
```

### 2. Backend Configuration (`/server/.env`)
```env
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_secure_jwt_secret_hash
PORT=5000
GOOGLE_API_KEY=your_google_maps_key
```

---

## 🚀 Running Locally

### Step 1: Install Dependencies
Run the following command in the root folder to download the dependencies for both frontend and server:
```bash
npm install
```

### Step 2: Start the Backend Server
```bash
npm start
```

### Step 3: Run the Frontend (Vite)
```bash
npm run dev
```

---

## 🌐 Production Deployment

* **Database**: MongoDB Atlas.
* **Backend Server**: Deploy the `/server` folder to **Render** or **Railway** as a Node service. Ensure you configure environment variables on the dashboard.
* **Frontend App**: Deploy the built static assets from `/dist` to **Vercel** or **Netlify**.
