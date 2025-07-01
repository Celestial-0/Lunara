# Lunara API Documentation

This document provides comprehensive information about Lunara's REST API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Conversations](#conversations)
  - [Messages](#messages)
  - [Profile](#profile)
  - [Preferences](#preferences)
  - [Notifications](#notifications)
  - [Search](#search)
  - [Export](#export)

## Authentication

Lunara uses NextAuth.js for authentication. All protected endpoints require a valid session.

### Session Cookie
```
next-auth.session-token=<session_token>
```

### Headers
```http
Cookie: next-auth.session-token=<session_token>
Content-Type: application/json
```

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Response Format

### Success Response
```json
{
  "data": {
    // Response data
  },
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Errors
```json
{
  "error": "Unauthorized",
  "details": "Please sign in to access this resource"
}
```

## Rate Limiting

Currently, rate limiting is implemented at the application level:
- Free users: 15 messages per account
- Users with personal API key: Unlimited

## Endpoints

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "user"
  },
  "message": "User created successfully"
}
```

### Conversations

#### Get All Conversations
```http
GET /api/conversations
```

**Response:**
```json
[
  {
    "id": "conv_id",
    "userId": "user_id",
    "title": "Conversation Title",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "messageCount": 5,
    "lastMessage": {
      "id": "msg_id",
      "content": "Last message content",
      "role": "assistant",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
]
```

#### Create Conversation
```http
POST /api/conversations
```

**Request Body:**
```json
{
  "title": "New Conversation" // optional
}
```

**Response:**
```json
{
  "id": "conv_id",
  "userId": "user_id",
  "title": "New Conversation",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "messages": [],
  "messageCount": 0
}
```

#### Get Conversation
```http
GET /api/conversations/{id}
```

**Response:**
```json
{
  "id": "conv_id",
  "userId": "user_id",
  "title": "Conversation Title",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "messages": [
    {
      "id": "msg_id",
      "content": "Message content",
      "role": "user",
      "audioUrl": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### Update Conversation
```http
PUT /api/conversations/{id}
```

**Request Body:**
```json
{
  "title": "Updated Title"
}
```

#### Delete Conversation
```http
DELETE /api/conversations/{id}
```

### Messages

#### Get Messages
```http
GET /api/conversations/{id}/messages?limit=50&cursor=msg_id
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (max 100, default 50)
- `cursor` (optional): Message ID for pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_id",
      "conversationId": "conv_id",
      "content": "Message content",
      "role": "user",
      "audioUrl": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "next_msg_id"
}
```

#### Create Message
```http
POST /api/conversations/{id}/messages
```

**Request Body:**
```json
{
  "content": "Message content",
  "role": "user",
  "audioUrl": "https://example.com/audio.mp3" // optional
}
```

#### Update Message
```http
PUT /api/messages/{id}
```

**Request Body:**
```json
{
  "content": "Updated content",
  "audioUrl": "https://example.com/audio.mp3"
}
```

#### Delete Message
```http
DELETE /api/messages/{id}
```

### Chat (AI Processing)

#### Send Chat Message
```http
POST /api/chat
```

**Request Body:**
```json
{
  "conversationId": "conv_id",
  "message": "User message to AI"
}
```

**Response:**
```json
{
  "content": "AI response content",
  "messageId": "msg_id"
}
```

**Error Response (Rate Limited):**
```json
{
  "error": "FREE_LIMIT_REACHED",
  "message": "You have reached the limit of 15 free messages.",
  "messageCount": 15,
  "limit": 15
}
```

### Profile

#### Get Profile
```http
GET /api/profile
```

**Response:**
```json
{
  "id": "profile_id",
  "userId": "user_id",
  "bio": "User bio",
  "phone": "+1234567890",
  "location": "City, Country",
  "website": "https://example.com",
  "company": "Company Name",
  "jobTitle": "Job Title",
  "avatar": "https://example.com/avatar.jpg",
  "showEmail": true,
  "showPhone": false,
  "showLocation": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "user": {
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### Update Profile
```http
PUT /api/profile
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "bio": "Updated bio",
  "phone": "+1234567890",
  "location": "Updated Location",
  "website": "https://updated.com",
  "company": "Updated Company",
  "jobTitle": "Updated Title",
  "showEmail": true,
  "showPhone": false,
  "showLocation": true
}
```

#### Upload Avatar
```http
POST /api/profile/avatar
```

**Request Body (multipart/form-data):**
```
avatar: [File] // Max 5MB, image files only
```

**Response:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### Delete Avatar
```http
DELETE /api/profile/avatar
```

#### Get Profile Stats
```http
GET /api/profile/stats
```

**Response:**
```json
{
  "conversations": 25,
  "messages": 150,
  "chatTime": "2h 30m",
  "daysActive": 15,
  "joinDate": "2025-01-01T00:00:00Z"
}
```

#### Change Password
```http
PUT /api/profile/change-password
```

**Request Body:**
```json
{
  "currentPassword": "current123", // required if user has password
  "newPassword": "newpassword123"
}
```

#### Get Password Status
```http
GET /api/profile/password-status
```

**Response:**
```json
{
  "canChangePassword": true,
  "hasPassword": true,
  "isGoogleUser": false,
  "requiresCurrentPassword": true,
  "message": "change_password"
}
```

#### Delete Account
```http
DELETE /api/profile/delete-account
```

### Preferences

#### Get Preferences
```http
GET /api/preferences
```

**Response:**
```json
{
  "aiPersonality": "friendly",
  "voiceEnabled": true,
  "voiceSpeed": 1.0,
  "voicePitch": 1.0,
  "theme": "system",
  "messageCount": 5,
  "hasApiKey": false
}
```

#### Update Preferences
```http
PUT /api/preferences
```

**Request Body:**
```json
{
  "aiPersonality": "professional",
  "voiceEnabled": false,
  "voiceSpeed": 1.2,
  "voicePitch": 0.8,
  "theme": "dark"
}
```

#### Set Gemini API Key
```http
POST /api/preferences/gemini-api-key
```

**Request Body:**
```json
{
  "apiKey": "your-gemini-api-key"
}
```

#### Remove Gemini API Key
```http
DELETE /api/preferences/gemini-api-key
```

### Notifications

#### Get Notifications
```http
GET /api/notifications?includeRead=false&limit=50&page=1&type=message
```

**Query Parameters:**
- `includeRead` (optional): Include read notifications (default: false)
- `limit` (optional): Number of notifications (default: 50, max: 100)
- `page` (optional): Page number for pagination (default: 1)
- `type` (optional): Filter by type (message, system, security, feature)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_id",
      "type": "message",
      "title": "New message",
      "description": "You have a new message from Lunara",
      "read": false,
      "priority": "medium",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

#### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/mark-all-read
```

#### Delete Notification
```http
DELETE /api/notifications/{id}
```

#### Delete All Notifications
```http
DELETE /api/notifications
```

### Search

#### Search Conversations
```http
GET /api/search?q=search+term&type=conversations&limit=20
```

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Search type (conversations, messages, all)
- `limit` (optional): Number of results (default: 20, max: 100)

**Response:**
```json
{
  "results": {
    "conversations": [
      {
        "id": "conv_id",
        "title": "Conversation Title",
        "snippet": "Highlighted search snippet...",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "messages": [
      {
        "id": "msg_id",
        "conversationId": "conv_id",
        "content": "Message content with highlight...",
        "role": "user",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  },
  "total": 15,
  "query": "search term"
}
```

### Export

#### Export User Data
```http
GET /api/export?format=json&type=all
```

**Query Parameters:**
- `format` (optional): Export format (json, csv) (default: json)
- `type` (optional): Data type (all, conversations, profile) (default: all)

**Response (JSON):**
```json
{
  "exportedAt": "2025-01-01T00:00:00Z",
  "userId": "user_id",
  "profile": {
    "name": "User Name",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z",
    "profile": { /* profile data */ },
    "preferences": { /* preferences data */ }
  },
  "conversations": [
    {
      "id": "conv_id",
      "title": "Conversation Title",
      "messages": [ /* messages */ ],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Response (CSV):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="Lunara-export.csv"

Conversation ID,Conversation Title,Message ID,Role,Content,Created At
conv_id,Conversation Title,msg_id,user,"Message content",2025-01-01T00:00:00Z
```

## WebSocket Events (Future)

*Note: WebSocket support is planned for future releases to enable real-time features.*

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');
```

### Events
- `message_created` - New message in conversation
- `conversation_updated` - Conversation metadata changed
- `notification_created` - New notification
- `user_typing` - User typing indicator

## SDKs and Libraries

### JavaScript/TypeScript SDK (Planned)
```javascript
import { LunaraClient } from '@lunara/sdk';

const client = new LunaraClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.lunara.dev'
});

// Send message
const response = await client.chat.send({
  conversationId: 'conv_id',
  message: 'Hello Lunara!'
});
```

## Examples

### Complete Chat Flow
```javascript
// 1. Create conversation
const conversation = await fetch('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Chat' })
});

// 2. Send message to AI
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: conversation.id,
    message: 'Hello, how are you?'
  })
});

// 3. Get updated conversation
const updated = await fetch(`/api/conversations/${conversation.id}`);
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* data */ })
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (error.error === 'FREE_LIMIT_REACHED') {
      // Handle rate limit
      showApiKeyDialog();
    } else {
      // Handle other errors
      showErrorMessage(error.error);
    }
  }
} catch (error) {
  // Handle network errors
  showErrorMessage('Network error occurred');
}
```

## Testing

### API Testing with curl
```bash
# Get conversations
curl -X GET "http://localhost:3000/api/conversations" \
  -H "Cookie: next-auth.session-token=your-session-token"

# Send chat message
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"conversationId":"conv_id","message":"Hello!"}'
```

## Support

For API support and questions:
- 📖 [API Documentation](https://github.com/Celestial-0/Lunara/blob/main/API.md)
- 🐛 [Report Issues](https://github.com/Celestial-0/Lunara/issues)
- 💬 [GitHub Discussions](https://github.com/Celestial-0/Lunara/discussions)
