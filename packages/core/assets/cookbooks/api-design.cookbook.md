# API Design Cookbook

Best practices and patterns for designing robust, scalable APIs.

## RESTful API Design

### Resource Naming
```
# Good - plural nouns
GET /api/users
GET /api/users/123
POST /api/users

# Avoid - verbs in URLs
GET /api/getUser
POST /api/createUser
```

### HTTP Methods
- **GET**: Retrieve resource(s)
- **POST**: Create new resource
- **PUT**: Update entire resource
- **PATCH**: Update partial resource
- **DELETE**: Remove resource

### Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no body
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

## API Versioning

### URL Versioning (Recommended)
```
GET /api/v1/users
GET /api/v2/users
```

### Header Versioning
```
GET /api/users
Accept: application/vnd.company.v1+json
```

## Pagination

```json
GET /api/users?page=2&limit=20

{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Error Handling

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Rate Limiting

Include rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Authentication

### Bearer Token (Recommended)
```
Authorization: Bearer <token>
```

### API Key
```
X-API-Key: <api-key>
```

## HATEOAS (Hypermedia)

```json
{
  "id": 123,
  "name": "John Doe",
  "links": {
    "self": "/api/users/123",
    "posts": "/api/users/123/posts",
    "friends": "/api/users/123/friends"
  }
}
```

## Best Practices

1. **Use HTTPS**: Always encrypt API traffic
2. **Validate Input**: Sanitize and validate all inputs
3. **Document API**: Use OpenAPI/Swagger specs
4. **Cache Responses**: Use ETags and Cache-Control headers
5. **Idempotency**: Ensure PUT and DELETE are idempotent
6. **Consistent Naming**: Use consistent casing (camelCase or snake_case)
7. **Filtering & Sorting**: Support query parameters
   ```
   GET /api/users?status=active&sort=created_at:desc
   ```
8. **Response Compression**: Enable gzip compression
9. **API Gateway**: Consider using an API gateway for routing, rate limiting, and auth
10. **Monitoring**: Log requests, track errors, monitor performance
