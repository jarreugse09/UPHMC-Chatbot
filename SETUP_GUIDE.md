# Quick Start Guide - Perpetual ChatBot

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (already configured)
- Gemini API key (needs to be updated - see below)

---

## Current Status

✅ **Both servers are running:**

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## Running the Application

### Start Backend

```bash
cd backend
npm install  # Only needed first time
npm run dev  # Starts with nodemon
```

### Start Frontend

```bash
cd frontend
npm install  # Only needed first time
npm run dev  # Starts Vite dev server
```

---

## What's Working ✅

1. **User Registration** - Create new accounts
   - Secure password hashing with bcryptjs
   - Validation on email and password strength
2. **User Login** - Authenticate with email/password
   - JWT token generation
   - Token persisted in localStorage
3. **Protected Routes** - Conversation and chat endpoints require authentication
4. **Database Storage** - All data persisted in MongoDB
   - Users
   - Conversations
   - Messages

5. **API Communication** - Frontend can reach backend
   - CORS enabled
   - Request interceptors working
   - Error handling in place

---

## What Needs Attention ⚠️

### Gemini API Configuration

The chat feature requires a valid Gemini API key with billing enabled.

**Steps to fix:**

1. Go to https://console.cloud.google.com/
2. Select your project
3. Enable the "Generative Language API"
4. Create an API Key in Credentials section
5. Enable billing for the project
6. Update the key in `backend/.env`:
   ```
   GEMINI_API_KEY=your-new-key-here
   ```
7. Restart the backend: `npm run dev`

---

## Testing the API

### Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Test User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Sending a Message (requires valid token)

```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "conversationId": null,
    "message": "Hello!"
  }'
```

---

## Environment Variables

### Backend (.env file)

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://jarreugse09:1ZAM960vYoSmXkWh@cluster0.rhxetae.mongodb.net/perps-chatbot?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GEMINI_API_KEY=AIzaSyD-pBXq_SwxxVhc0A2JGFpPrqqKw5tIyfI  # ← UPDATE THIS
NODE_ENV=development
```

### Frontend (.env file)

```dotenv
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
Perpetual_ChatBot/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express entry point
│   │   ├── config/database.ts     # MongoDB connection
│   │   ├── models/                # Mongoose schemas
│   │   ├── controllers/           # Route handlers
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth, error handling
│   │   ├── services/geminiService.ts # AI integration
│   │   └── types/index.ts         # TypeScript types
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── context/AuthContext.tsx # Auth state management
│   │   ├── services/api.ts        # Axios configuration
│   │   ├── types/index.ts         # TypeScript types
│   │   ├── App.tsx                # Main app component
│   │   └── main.tsx               # Entry point
│   └── package.json
│
└── TEST_RESULTS.md               # Detailed test report
```

---

## Troubleshooting

### Backend won't start

- Check if port 5000 is already in use
- Verify MongoDB connection string in .env
- Check Node.js version: `node --version`

### Frontend won't start

- Check if port 5173 is already in use
- Delete `node_modules` and run `npm install` again
- Clear browser cache

### Can't register users

- Check MongoDB connection is active
- Verify .env has correct MONGODB_URI
- Check backend console for errors

### Messages fail to send

- This is likely the Gemini API key issue
- Follow the Gemini API Configuration steps above
- Check backend logs for the specific error

---

## API Endpoints Reference

### Authentication

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

### Conversations

- `GET /api/conversations` - Get all conversations (auth required)
- `GET /api/conversations/:id` - Get specific conversation (auth required)
- `POST /api/conversations` - Create new conversation (auth required)
- `DELETE /api/conversations/:id` - Delete conversation (auth required)
- `PATCH /api/conversations/:id/title` - Update conversation title (auth required)

### Chat

- `POST /api/chat/message` - Send message and get AI response (auth required)

### Health

- `GET /api/health` - Check if backend is running

---

## Next Steps

1. Update the Gemini API key (see above)
2. Test the chat functionality end-to-end
3. Customize the AI system prompt in `backend/src/services/geminiService.ts`
4. Add any additional features or endpoints as needed
5. Deploy to production (update CORS origins in server.ts)

---

## Support

For detailed test results and issue explanations, see `TEST_RESULTS.md`
