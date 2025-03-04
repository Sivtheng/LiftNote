# Questionnaire API

## Store Questionnaire Data

- Endpoint: POST /api/clients/{client}/questionnaire
- Description: Store answers to a client’s questionnaire.
- Request Headers:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

- Request Body:

```bash
{
  "question": "What is your favorite color?",
  "answer": "Blue",
  "question_type": "text", 
  "options": null
}
```

Response:

```bash
{
  "message": "Questionnaire saved successfully!"
}
```

## Retrieve Questionnaire Data

- Endpoint: GET /api/clients/{client}/questionnaire
- Description: Retrieve the stored questionnaire answers for a client.
- Request Headers:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- Response:

```bash
[
  {
    "id": 1,
    "client_id": 1,
    "question": "What is your favorite color?",
    "answer": "Blue",
    "question_type": "text",
    "options": null,
    "created_at": "2025-03-04T03:00:00.000000Z",
    "updated_at": "2025-03-04T03:00:00.000000Z"
  }
]
```

## Store Questionnaire Data with cURL

```bash
curl -X POST http://localhost:8000/api/clients/1/questionnaire \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "What is your favorite color?", "answer": "Blue", "question_type": "text", "options": null}'
```

## Retrieve Stored Questionnaire Data

```bash
curl -X GET http://localhost:8000/api/clients/1/questionnaire \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
