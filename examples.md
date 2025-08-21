# Digest Proxy Usage Examples

## Basic Usage

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Simple GET Request
```bash
curl "http://localhost:3000?target=https://httpbin.org/get" \
  -H "Authorization: Bearer username:password"
```

### 3. POST Request with JSON Body
```bash
curl -X POST "http://localhost:3000?target=https://httpbin.org/post" \
  -H "Authorization: Bearer username:password" \
  -H "Content-Type: application/json" \
  -d '{"key": "value", "test": true}'
```

### 4. XML Request (like KingHost API)
```bash
curl -X POST "http://localhost:3000?target=https://api.kinghost.net/email/addmailbox.xml" \
  -H "Authorization: Bearer myuser:mypassword" \
  -H "Content-Type: application/xml" \
  -d '<mailbox><name>test@domain.com</name><quota>100</quota></mailbox>'
```

### 5. PUT Request
```bash
curl -X PUT "http://localhost:3000?target=https://httpbin.org/put" \
  -H "Authorization: Bearer username:password" \
  -H "Content-Type: application/json" \
  -d '{"updated": true}'
```

### 6. DELETE Request
```bash
curl -X DELETE "http://localhost:3000?target=https://httpbin.org/delete" \
  -H "Authorization: Bearer username:password"
```

## Testing with Different Tools

### Using PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3000?target=https://httpbin.org/get" `
  -Headers @{"Authorization"="Bearer username:password"}
```

### Using Python
```python
import requests

response = requests.post(
    "http://localhost:3000?target=https://httpbin.org/post",
    headers={"Authorization": "Bearer username:password"},
    json={"message": "Hello from Python"}
)
print(response.json())
```

### Using Node.js
```javascript
const axios = require('axios');

const response = await axios.post(
    'http://localhost:3000?target=https://httpbin.org/post',
    { message: 'Hello from Node.js' },
    {
        headers: {
            'Authorization': 'Bearer username:password',
            'Content-Type': 'application/json'
        }
    }
);
console.log(response.data);
```

## Error Handling Examples

### Missing Target URL
```bash
curl http://localhost:3000
# Returns: {"error": "Missing target URL parameter"}
```

### Missing Authorization
```bash
curl "http://localhost:3000?target=https://httpbin.org/get"
# Returns: {"error": "Missing or invalid Authorization header"}
```

### Invalid Authorization Format
```bash
curl "http://localhost:3000?target=https://httpbin.org/get" \
  -H "Authorization: Bearer invalidformat"
# Returns: {"error": "Invalid Bearer token format. Expected: username:password"}
```

## Advanced Scenarios

### Forwarding Custom Headers
```bash
curl -X POST "http://localhost:3000?target=https://httpbin.org/post" \
  -H "Authorization: Bearer username:password" \
  -H "X-Custom-Header: custom-value" \
  -H "User-Agent: MyApp/1.0" \
  -d '{"data": "test"}'
```

### Binary File Upload
```bash
curl -X POST "http://localhost:3000?target=https://httpbin.org/post" \
  -H "Authorization: Bearer username:password" \
  -F "file=@document.pdf" \
  -F "description=Important document"
```

## Monitoring and Debugging

### Check Server Status
```bash
# Health check
curl http://localhost:3000/health

# Check if server is running
netstat -an | grep :3000
```

### View Server Logs
The server provides comprehensive logging including:
- Incoming requests with headers and body
- Target URL being forwarded to
- Digest authentication challenges and responses
- Outgoing requests and responses
- Errors and authentication failures

### Docker Monitoring
```bash
# View running containers
docker ps

# View container logs
docker logs digest-proxy

# Check container health
docker inspect digest-proxy | grep Health -A 10
```
