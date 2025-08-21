import express from 'express';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { createHash, randomBytes } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, req.body);
  }
  next();
});

// Helper function to parse Digest challenge
function parseDigestChallenge(wwwAuthenticate: string): Record<string, string> {
  const challenge = wwwAuthenticate.replace('Digest ', '');
  const params: Record<string, string> = {};
  
  challenge.split(',').forEach(param => {
    const [key, value] = param.trim().split('=');
    if (key && value) {
      params[key] = value.replace(/"/g, '');
    }
  });
  
  return params;
}

// Helper function to generate Digest response
function generateDigestResponse(
  username: string,
  password: string,
  method: string,
  uri: string,
  realm: string,
  nonce: string,
  qop: string,
  nc: string,
  cnonce: string
): string {
  const ha1 = createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = createHash('md5').update(`${method}:${uri}`).digest('hex');
  
  let response: string;
  if (qop === 'auth' || qop === 'auth-int') {
    response = createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
  } else {
    response = createHash('md5').update(`${ha1}:${nonce}:${ha2}`).digest('hex');
  }
  
  return response;
}

// Helper function to build Digest Authorization header
function buildDigestAuthHeader(
  username: string,
  password: string,
  method: string,
  uri: string,
  realm: string,
  nonce: string,
  qop: string,
  nc: string,
  cnonce: string
): string {
  const response = generateDigestResponse(username, password, method, uri, realm, nonce, qop, nc, cnonce);
  
  let authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
  
  if (qop) {
    authHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }
  
  return authHeader;
}

// Health check endpoint (must come before the catch-all route)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main proxy endpoint (catches all other requests)
app.all('*', async (req, res) => {
  try {
    const targetUrl = req.query.target as string;
    
    if (!targetUrl) {
      console.log('❌ No target URL provided');
      return res.status(400).json({ error: 'Missing target URL parameter' });
    }
    
    console.log(`🎯 Target URL: ${targetUrl}`);
    
    // Extract Bearer token (username:password)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token provided');
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    const [username, password] = bearerToken.split(':');
    
    if (!username || !password) {
      console.log('❌ Invalid Bearer token format (should be username:password)');
      return res.status(401).json({ error: 'Invalid Bearer token format. Expected: username:password' });
    }
    
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: [HIDDEN]`);
    
    // Prepare the request to target
    const requestConfig: AxiosRequestConfig = {
      method: req.method,
      url: targetUrl,
      headers: {},
      validateStatus: (status) => true, // Don't throw on any status
    };
    
    // Only set data for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) && req.body) {
      requestConfig.data = req.body;
    }
    
    // Forward only safe headers, excluding problematic ones
    const safeHeaders = [
      'content-type',
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding',
      'cache-control',
      'pragma',
      'x-requested-with',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-real-ip'
    ];
    
    // Copy only safe headers
    Object.entries(req.headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (safeHeaders.includes(lowerKey) && value) {
        requestConfig.headers![key] = value;
      }
    });
    
    // Set host header for target
    requestConfig.headers!.host = new URL(targetUrl).host;
    
    console.log(`📤 Forwarding ${req.method} request to ${targetUrl}`);
    console.log(`📋 Forwarding headers:`, requestConfig.headers);
    
    // Make the first request (might get a 401 with Digest challenge)
    let response: AxiosResponse;
    try {
      response = await axios(requestConfig);
      console.log(`📥 Initial response status: ${response.status}`);
    } catch (error) {
      console.log(`❌ Error in initial request:`, error);
      return res.status(500).json({ error: 'Failed to forward request' });
    }
    
    // If we get a 401, handle Digest authentication
    if (response.status === 401) {
      const wwwAuthenticate = response.headers['www-authenticate'];
      
      if (wwwAuthenticate && wwwAuthenticate.startsWith('Digest ')) {
        console.log(`🔐 Received Digest challenge: ${wwwAuthenticate}`);
        
        try {
          const challenge = parseDigestChallenge(wwwAuthenticate);
          console.log(`📋 Parsed challenge:`, challenge);
          
          const realm = challenge.realm || '';
          const nonce = challenge.nonce || '';
          const qop = challenge.qop || '';
          
          if (!realm || !nonce) {
            console.log('❌ Missing required challenge parameters');
            return res.status(500).json({ error: 'Invalid Digest challenge' });
          }
          
          // Generate Digest response
          const nc = '00000001';
          const cnonce = randomBytes(16).toString('hex');
          const uri = new URL(targetUrl).pathname + new URL(targetUrl).search;
          
          const digestAuth = buildDigestAuthHeader(
            username, password, req.method, uri, realm, nonce, qop, nc, cnonce
          );
          
          console.log(`🔐 Generated Digest auth: ${digestAuth}`);
          
          // Make the authenticated request
          const authRequestConfig: AxiosRequestConfig = {
            ...requestConfig,
            headers: {
              ...requestConfig.headers,
              authorization: digestAuth,
            },
          };
          
          console.log(`📤 Making authenticated request with Digest auth`);
          const authResponse = await axios(authRequestConfig);
          
          console.log(`✅ Authenticated response status: ${authResponse.status}`);
          console.log(`📥 Response headers:`, authResponse.headers);
          
          // Forward the response
          res.status(authResponse.status);
          
          // Forward response headers, excluding problematic ones
          const safeResponseHeaders = [
            'content-type',
            'cache-control',
            'etag',
            'last-modified',
            'expires',
            'pragma',
            'vary',
            'x-powered-by',
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection'
          ];
          
          Object.entries(authResponse.headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (safeResponseHeaders.includes(lowerKey) && value) {
              res.setHeader(key, value);
            }
          });
          
          // Handle Content-Length specially to avoid conflicts
          if (authResponse.headers['content-length'] && !authResponse.headers['transfer-encoding']) {
            res.setHeader('content-length', authResponse.headers['content-length']);
          }
          
          return res.send(authResponse.data);
          
        } catch (error) {
          console.log(`❌ Error handling Digest authentication:`, error);
          return res.status(500).json({ error: 'Failed to handle Digest authentication' });
        }
      } else {
        console.log(`❌ Received 401 but no Digest challenge`);
        return res.status(401).json({ error: 'Authentication required' });
      }
    } else {
      // If no authentication was required, forward the response as-is
      console.log(`✅ Forwarding response with status ${response.status}`);
      console.log(`📥 Response headers:`, response.headers);
      
      res.status(response.status);
      
      // Forward response headers, excluding problematic ones
      const safeResponseHeaders = [
        'content-type',
        'cache-control',
        'etag',
        'last-modified',
        'expires',
        'pragma',
        'vary',
        'x-powered-by',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];
      
      Object.entries(response.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (safeResponseHeaders.includes(lowerKey) && value) {
          res.setHeader(key, value);
        }
      });
      
      // Handle Content-Length specially to avoid conflicts
      if (response.headers['content-length'] && !response.headers['transfer-encoding']) {
        res.setHeader('content-length', response.headers['content-length']);
      }
      
      return res.send(response.data);
    }
    
  } catch (error) {
    console.log(`❌ Unexpected error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Digest Proxy Server running on port ${PORT}`);
  console.log(`📖 Usage: POST http://localhost:${PORT}?target=<target_url> with Authorization: Bearer username:password`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

export default app;
