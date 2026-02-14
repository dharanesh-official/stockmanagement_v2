# Stock Manager - Full Stack Application

This project is a complete inventory management system built with:
- **Frontend**: React (Vite) + Vanilla CSS (Premium Design)
- **Backend**: Node.js (Express) + PostgreSQL
- **Mobile**: React Native (Reference Implementation)
- **Database**: PostgreSQL

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase / PostgreSQL)

**Option A: Supabase (Recommended for Cloud)**
1. Create a project on [Supabase.com](https://supabase.com/).
2. Go to **Project Settings > Database** and copy the **Connection string (URI)**.
   - Make sure to use the password you created for the database.
   - It looks like: `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
3. Edit `server/.env` and paste it as `DATABASE_URL`.
4. Go to the **SQL Editor** in Supabase dashboard.
5. Copy the contents of `server/schema.sql` and run it in the SQL Editor to create tables.

**Option B: Local PostgreSQL**
1. Create a database named `stockmanager`.
   ```bash
   createdb stockmanager
   ```
2. Run the schema script to create tables.
   ```bash
   psql -U postgres -d stockmanager -f server/schema.sql
   ```

### 2. Backend Setup (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Rename `.env.example` to `.env`.
   - Update `DB_PASSWORD` and other credentials in `.env`.
4. Start the server:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`.

### 3. Frontend Setup (Web)
1. Open a new terminal and navigate to the web directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Web app will run on `http://localhost:5173`.

### 4. Create Admin User
Use Postman or curl to register the first Admin user:
```bash
POST http://localhost:5000/api/auth/register
Body:
{
  "full_name": "Super Admin",
  "email": "admin@company.com",
  "password": "password123",
  "role": "admin"
}
```
Or use the frontend Register page (if implemented) or modify the database directly.

## 📱 Mobile App Setup
To run the mobile app:

1. Install Expo Go on your phone.
2. Initialize a new Expo project:
   ```bash
   npx create-expo-app mobile
   cd mobile
   npm install axios
   ```
3. Copy the content of `mobile_reference/App.js` into your new `App.js`.
4. Update `API_URL` in `App.js` to your computer's local IP address (e.g., `192.168.1.5`).
5. Run the app:
   ```bash
   npx expo start
   ```

## 🎨 Features
- **Admin Dashboard**: Manage Stock, Customers, Sales, Finance.
- **Salesman Dashboard**: View Stock, Create Orders, View Own Sales.
- **Real-time Sync**: Actions on web reflect immediately on mobile via the API.
