# Auth API

## Register a New Client

- Endpoint: POST /api/register
- Description: Registers a new client.
- Request Body:

```json
{
  "name": "Test Client",
  "email": "<client@example.com>",
  "password": "password123",
  "password_confirmation": "password123"
}
```

Response:

```json
{
  "client": { ... },
  "role": "client",
  "token": "1|token_here"
}
```

## Log In

- Endpoint: POST /api/login
- escription: Logs in and returns a token.
- Request Body:

```json
{
  "email": "<client@example.com>",
  "password": "password123"
}
```

Response:

```json
{
  "client": { ... },
  "role": "client",
  "token": "1|token_here"
}
```

## Get Profile

- Endpoint: GET /api/profile
- Description: Returns the profile of the authenticated user.
- Headers:

  - ```Authorization: Bearer YOUR_ACCESS_TOKEN```

Response:

```json
{
  "user": { ... }
}
```

## Log Out

- Endpoint: POST /api/logout
- Description: Logs out the authenticated user.
- Headers:
  - ```Authorization: Bearer YOUR_ACCESS_TOKEN```
Response:

```json
{
  "message": "Logged out successfully"
}

## Testing the API (cURL)

- Register a New Client

```bash
curl -X POST <http://localhost:8000/api/register> \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Client", "email": "<client@example.com>", "password": "password123", "password_confirmation": "password123"}'
```

- Log In

```bash
curl -X POST <http://localhost:8000/api/login> \
     -H "Content-Type: application/json" \
     -d '{"email": "<client@example.com>", "password": "password123"}'
```

- Get Profile (Authenticated)

```bash
curl -X GET <http://localhost:8000/api/profile> \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

- Log Out

```bash
curl -X POST <http://localhost:8000/api/logout> \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
