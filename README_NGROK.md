# Ngrok Multi-Tunnel Setup Guide

This project is configured to run both the frontend and backend servers concurrently, and expose them to the web using ngrok tunnels.

## Step 1: Add your Ngrok Authtoken
To use the custom `ngrok.yml` file, you need to add your ngrok authtoken:
1. Open terminal in the root directory.
2. Run the following command:
   ```bash
   ngrok config add-authtoken <YOUR_AUTHTOKEN>
   ```
   *(Or you can add a line `authtoken: YOUR_TOKEN` at the top of `./ngrok.yml`)*

## Step 2: Install dependencies
Run `npm install` in the root directory to install `concurrently` (used to run both servers with one command):
```bash
npm install
```

## Step 3: Run Frontend and Backend Together
To start both the Vite frontend (port 5173) and the Node.js backend (port 5000) concurrently in a single terminal, run:
```bash
npm run dev
```

## Step 4: Run Ngrok Tunnels
To expose both servers to the public internet using the configuration in `./ngrok.yml`, open a new terminal in the root directory and run:
```bash
npm run ngrok
```
This will output two public URLs:
* One for the **frontend** (e.g., `https://xxxx.ngrok-free.app` -> `http://localhost:5173`)
* One for the **backend** (e.g., `https://yyyy.ngrok-free.app` -> `http://localhost:5000`)

## Step 5: Connect Frontend to Backend (Crucial)
Since the frontend runs in the client's browser, it needs the public URL of the backend to communicate.
1. Copy the backend's public ngrok URL (e.g. `https://yyyy.ngrok-free.app`).
2. Create or edit `d:\Rental AI Chatboat\frontend\.env` and add:
   ```env
   VITE_API_BASE=https://yyyy.ngrok-free.app/api
   ```
3. Restart/build the frontend so it picks up the environment variable. Now your external users can access the chatbot page via the frontend ngrok URL, and it will correctly talk to your backend API!
