#!/bin/bash

# Cookie Inspection Feature - Interactive Demo
# This script demonstrates the cookie inspection feature by making test requests

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         Paperplane Cookie Inspection Feature Demo                 ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:3000/api/proxy"

# Check if server is running
echo "→ Checking if development server is running..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/get","method":"GET"}' 2>/dev/null)

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Error: Development server not responding on port 3000 (HTTP $HTTP_CODE)"
    echo "   Please run: npm run dev"
    exit 1
fi
echo "✓ Server is running"
echo ""

# Demo 1: Simple cookie
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 1: Simple Session Cookie"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Request: GET https://httpbin.org/response-headers?Set-Cookie=session=abc123"
echo ""
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/response-headers?Set-Cookie=session%3Dabc123","method":"GET"}' \
  | jq -r '.cookies[] | "  Name:  \(.name)\n  Value: \(.value)"'
echo ""
sleep 2

# Demo 2: Secure authentication cookie
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 2: Secure Authentication Cookie"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Request: Cookie with HttpOnly, Secure, and SameSite attributes"
echo ""
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/response-headers?Set-Cookie=auth_token%3Dsecret123%3B%20Path%3D%2F%3B%20Domain%3Dexample.com%3B%20HttpOnly%3B%20Secure%3B%20SameSite%3DStrict","method":"GET"}' \
  | jq -r '.cookies[] | "  Name:      \(.name)\n  Value:     \(.value)\n  Path:      \(.path // "not set")\n  Domain:    \(.domain // "not set")\n  HttpOnly:  \(.httpOnly // false)\n  Secure:    \(.secure // false)\n  SameSite:  \(.sameSite // "not set")"'
echo ""
sleep 2

# Demo 3: Cookie with expiration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 3: Cookie with Max-Age (Session Management)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Request: Cookie with 1-hour expiration (Max-Age: 3600 seconds)"
echo ""
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/response-headers?Set-Cookie=session%3Duser456%3B%20Max-Age%3D3600%3B%20Path%3D%2Fapp%3B%20HttpOnly","method":"GET"}' \
  | jq -r '.cookies[] | "  Name:      \(.name)\n  Value:     \(.value)\n  Max-Age:   \(.maxAge // "not set")s (\((.maxAge // 0) / 60)m)\n  Path:      \(.path // "not set")\n  HttpOnly:  \(.httpOnly // false)"'
echo ""
sleep 2

# Demo 4: JWT token cookie
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 4: JWT Token Cookie (with = characters)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Request: Cookie with base64-encoded JWT token"
echo ""
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/response-headers?Set-Cookie=jwt%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc%3D%3D%3B%20HttpOnly%3B%20Secure","method":"GET"}' \
  | jq -r '.cookies[] | "  Name:      \(.name)\n  Value:     \(.value)\n  HttpOnly:  \(.httpOnly // false)\n  Secure:    \(.secure // false)"'
echo ""
sleep 2

# Demo 5: No cookies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 5: Response Without Cookies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Request: Regular API call with no Set-Cookie headers"
echo ""
COOKIE_COUNT=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/get","method":"GET"}' \
  | jq -r '.cookies | length')
echo "  Cookies received: $COOKIE_COUNT"
echo "  UI will show: Empty state with friendly message"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Demo Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Key Features Demonstrated:"
echo "  ✓ Basic cookie parsing (name + value)"
echo "  ✓ Security attributes (HttpOnly, Secure, SameSite)"
echo "  ✓ Expiration tracking (Max-Age, Expires)"
echo "  ✓ Domain and path scoping"
echo "  ✓ JWT/Base64 token handling (multiple = characters)"
echo "  ✓ Empty state for responses without cookies"
echo ""
echo "To see the visual UI:"
echo "  1. Open http://localhost:3000/dashboard in your browser"
echo "  2. Enter any URL and send a request"
echo "  3. Click the 'Cookies' tab in the response pane"
echo "  4. Try the test URLs from this demo"
echo ""
