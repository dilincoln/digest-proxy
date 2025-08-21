# Digest Proxy

A Node.js proxy server that receives requests with Bearer authentication (username:password) and forwards them to target URLs using Digest authentication.

## Features

- 🔐 Converts Bearer authentication to Digest authentication
- 📡 Forwards HTTP requests to any target URL
- 📝 Comprehensive logging for debugging
- 🐳 Docker support with docker-compose
- 🏥 Health check endpoint
- ⚡ Built with TypeScript and Express

## How It Works

1. **Receive Request**: The proxy receives a request with `Authorization: Bearer username:password`
2. **Forward Request**: Forwards the request to the target URL specified in the `target` query parameter
3. **Handle Digest Challenge**: If the target returns a 401 with a Digest challenge, the proxy:
   - Parses the challenge parameters (realm, nonce, qop, etc.)
   - Generates the appropriate Digest response using the provided credentials
   - Re-sends the request with proper Digest authentication
4. **Return Response**: Forwards the final response back to the client

## Usage

### Basic Request

```bash
curl -X POST "http://localhost:3000?target=https://api.kinghost.net/email/addmailbox.xml" \
  -H "Authorization: Bearer username:password" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

### Request Format

- **URL**: `http://localhost:3000?target=<target_url>`
- **Method**: Any HTTP method (GET, POST, PUT, DELETE, etc.)
- **Headers**: Include `Authorization: Bearer username:password`
- **Body**: Any request body will be forwarded

### Response

The proxy will return the response from the target URL, maintaining the original status code and headers.

## Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd digest-proxy
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Build and run production**:
   ```bash
   npm run build
   npm start
   ```

### Docker

1. **Build and run with docker-compose**:
   ```bash
   docker-compose up --build
   ```

2. **Or build and run manually**:
   ```bash
   docker build -t digest-proxy .
   docker run -p 3000:3000 digest-proxy
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Port Configuration

The server runs on port 3000 by default. You can change this by:

- Setting the `PORT` environment variable
- Modifying the `PORT` constant in `src/index.ts`

## API Endpoints

### Main Proxy Endpoint

- **URL**: `/*` (catches all requests)
- **Method**: Any HTTP method
- **Query Parameters**:
  - `target`: The target URL to forward the request to
- **Headers**: 
  - `Authorization: Bearer username:password` (required)

### Health Check

- **URL**: `/health`
- **Method**: GET
- **Response**: JSON with status and timestamp

## Logging

The proxy provides comprehensive logging for debugging:

- 📥 Incoming requests with headers and body
- 🎯 Target URL being forwarded to
- 🔐 Digest authentication challenges and responses
- 📤 Outgoing requests and responses
- ❌ Errors and authentication failures

## Example Use Cases

### Email API Integration

```bash
# Add mailbox to KingHost email service
curl -X POST "http://localhost:3000?target=https://api.kinghost.net/email/addmailbox.xml" \
  -H "Authorization: Bearer myuser:mypassword" \
  -H "Content-Type: application/xml" \
  -d '<mailbox><name>test@domain.com</name></mailbox>'
```

### Web Service Proxy

```bash
# Forward GET request to any web service
curl "http://localhost:3000?target=https://api.example.com/users" \
  -H "Authorization: Bearer username:password"
```

## Security Considerations

- **Credentials**: Username and password are transmitted in the Bearer token (consider using HTTPS in production)
- **Target URLs**: The proxy will forward to any URL - ensure proper access controls
- **Headers**: Most headers are forwarded, including sensitive ones
- **Rate Limiting**: Consider implementing rate limiting for production use

## Development

### Project Structure

```
digest-proxy/
├── src/
│   └── index.ts          # Main server implementation
├── Dockerfile            # Docker configuration
├── docker-compose.yaml   # Docker Compose setup
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Scripts

- `npm run dev`: Run in development mode with tsx
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run the built application
- `npm test`: Run tests (not implemented yet)

### Adding Features

The proxy is designed to be extensible:

- Add middleware in the Express app setup
- Extend the Digest authentication logic
- Add support for other authentication methods
- Implement caching or rate limiting

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that the Bearer token format is correct (`username:password`)
2. **Missing target**: Ensure the `target` query parameter is provided
3. **Digest challenge parsing**: Check logs for challenge parsing errors
4. **Network issues**: Verify the target URL is accessible

### Debug Mode

Enable more verbose logging by setting the log level or adding debug statements in the code.

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
