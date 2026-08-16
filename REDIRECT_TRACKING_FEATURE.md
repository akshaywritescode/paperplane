# Redirect Chain Tracking Feature

## Overview

Paperplane now tracks and displays the complete redirect chain for HTTP requests, similar to HTTPie. Instead of silently following redirects and only showing the final response, you can now see every hop in the redirect chain with full details.

## What Changed

### Before
- Proxy used `redirect: "follow"` - automatically followed all redirects
- Users only saw the final response (e.g., `200 OK`)
- No visibility into redirect hops (301, 302, 307, 308, etc.)
- Debugging redirect chains was impossible

### After
- Proxy uses `redirect: "manual"` - manually tracks each redirect
- **Redirects tab** shows complete redirect chain
- Each hop displays: status code, location URL, and headers
- Maximum of 20 redirects to prevent infinite loops
- Full integration with History and Repeater

## Features

### 1. Manual Redirect Tracking

The proxy now manually follows redirects and captures each hop:

```typescript
// Each redirect hop captures:
{
  statusCode: number;      // e.g., 301, 302, 307, 308
  statusText: string;      // e.g., "Moved Permanently"
  location: string;        // The target URL
  headers: Record<string, string>;  // All response headers
}
```

### 2. Redirects Tab in Response Pane

A new **Redirects** tab appears in the Response Pane when redirects are detected:

- **Badge shows redirect count**: "Redirects (2)" indicates 2 hops
- **Hop-by-hop visualization**: Each redirect shown as a card
- **Status code badges**: Color-coded by HTTP status family (3xx = blue)
- **Location URLs**: Full URLs with copy button
- **Expandable headers**: View all headers for each hop
- **Final response indicator**: Green banner showing where chain ended
- **Arrow connectors**: Visual flow from hop to hop

### 3. Redirect Types Supported

All HTTP redirect status codes are tracked:

| Code | Type | Description |
|------|------|-------------|
| 300 | Multiple Choices | Multiple options available |
| 301 | Moved Permanently | Permanent redirect (HTTP → HTTPS) |
| 302 | Found | Temporary redirect (most common) |
| 303 | See Other | Changes POST to GET |
| 307 | Temporary Redirect | Preserves method |
| 308 | Permanent Redirect | Preserves method |

### 4. Special Handling

#### 303 See Other
- Automatically changes method to GET for next request
- Body is not sent with subsequent requests

#### 301/302 Redirects
- Most browsers change POST to GET (legacy behavior)
- Implementation follows this common pattern

#### 307/308 Redirects
- Preserves HTTP method and body
- Stricter adherence to original request

#### Relative URLs
- Properly resolved using `new URL(location, currentUrl)`
- Handles both absolute and relative redirect locations

### 5. Max Redirects Protection

- Limit: **20 redirects** maximum
- Prevents infinite redirect loops
- If limit reached, final response is still returned
- Protects against misconfigured servers

## How to Use

### View Redirect Chain

1. **Send a request** that redirects (e.g., `http://github.com`)
2. **Check the Redirects tab** - appears automatically if redirects occurred
3. **See each hop**:
   - HOP 1: `301 Moved Permanently → https://github.com/`
   - FINAL RESPONSE: `200 OK`

### Copy Redirect URLs

- Click the **copy button** next to any location URL
- Use for debugging or manual testing

### View Redirect Headers

- Click **Headers (X)** to expand header details for each hop
- Useful for debugging authentication or cookie redirects

### Search Redirects

- Use the **search bar** at the bottom
- Searches across status codes and location URLs
- Highlights matching text

## Integration

### History

- Redirects are **saved with history entries**
- Restore a historical request to see its redirect chain
- Field: `responseRedirects` (JSON array)

### Repeater

- Redirects are **shown when replaying requests**
- Full redirect chain preserved
- Great for debugging repeated redirect flows

### Collections

- Saved requests **do not store redirect data**
- Redirects are response-specific, not request-specific
- Each time you run a saved request, fresh redirects are captured

## API Response Format

The proxy API now returns:

```json
{
  "statusCode": 200,
  "statusText": "OK",
  "headers": { ... },
  "cookies": [ ... ],
  "redirects": [
    {
      "statusCode": 301,
      "statusText": "Moved Permanently",
      "location": "https://example.com/new-path",
      "headers": {
        "location": "https://example.com/new-path",
        "content-length": "0"
      }
    }
  ],
  "body": "...",
  "time": 245,
  "size": 1024
}
```

**Note**: `redirects` field is omitted if no redirects occurred (rather than an empty array).

## Examples

### Example 1: HTTP to HTTPS Redirect

**Request**: `GET http://github.com`

**Redirect Chain**:
```
HOP 1: 301 Moved Permanently
└─ Location: https://github.com/

FINAL RESPONSE: 200 OK
```

### Example 2: Multiple Redirects

**Request**: `GET http://example.com/old-page`

**Redirect Chain**:
```
HOP 1: 301 Moved Permanently
└─ Location: http://example.com/new-page

HOP 2: 301 Moved Permanently  
└─ Location: https://example.com/new-page

FINAL RESPONSE: 200 OK
```

### Example 3: No Redirects

**Request**: `GET https://github.com`

**Result**: No Redirects tab appears (direct 200 OK response)

## Debugging Use Cases

### 1. Authentication Redirects
Track login flows that redirect through multiple domains:
- OAuth provider redirects
- SAML authentication chains
- SSO redirects

### 2. URL Shorteners
See the full resolution chain:
- `bit.ly/abc` → intermediate → final destination

### 3. Protocol Upgrades
Verify HTTP to HTTPS redirects:
- Check if site properly upgrades to secure connection
- Identify mixed-content issues

### 4. Domain Migrations
Track old domain to new domain redirects:
- Verify 301 (permanent) vs 302 (temporary)
- Check redirect targets are correct

### 5. CDN Redirects
Understand content delivery redirects:
- Geographic redirects
- Load balancer redirects
- Edge server hops

### 6. API Versioning
Track API endpoint redirects:
- `/v1/users` → `/v2/users`
- Deprecated endpoint redirects

## Performance Impact

- **Minimal overhead**: Only additional network cost is one request per redirect
- **No parsing overhead**: Redirect headers captured as-is
- **Efficient storage**: Redirects stored as JSON in history
- **UI optimization**: Redirects tab only rendered when needed

## Comparison with HTTPie

| Feature | Paperplane | HTTPie |
|---------|-----------|--------|
| Track redirects | ✅ | ✅ |
| Show status codes | ✅ | ✅ |
| Show locations | ✅ | ✅ |
| Show headers per hop | ✅ | ❌ |
| Visual hop indicators | ✅ | ❌ |
| Copy location URLs | ✅ | ❌ |
| Search redirects | ✅ | ❌ |
| Save in history | ✅ | ❌ |
| Max redirect protection | ✅ (20) | ✅ (30) |

## Technical Details

### Redirect Loop Prevention

The 20-redirect limit prevents:
- Infinite redirect loops (A → B → A → B ...)
- Misconfigured servers
- Malicious redirect chains
- Resource exhaustion

### Method Handling

Different redirects handle HTTP methods differently:

```typescript
// 303 See Other: Always change to GET
if (res.status === 303) {
  fetchOptions.method = "GET";
  delete fetchOptions.body;
}

// 301/302: Most browsers change POST to GET (legacy)
// 307/308: Preserve original method and body
```

### URL Resolution

Relative URLs are properly resolved:

```typescript
// Handles both:
currentUrl = new URL(location, currentUrl).toString();

// Absolute: "https://example.com/page"
// Relative: "/page" → resolved against currentUrl
```

### Type Definitions

```typescript
// ResponseState type
type ResponseState = {
  status: "done";
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: Array<Cookie>;
  redirects?: Array<{
    statusCode: number;
    statusText: string;
    location: string;
    headers: Record<string, string>;
  }>;
  body: string;
  time: number;
  size: number;
};
```

## Known Limitations

1. **Body not sent with redirects**: After the first request, body is omitted (standard redirect behavior)
2. **Max 20 redirects**: Hard limit to prevent infinite loops
3. **No redirect loop detection**: Will follow A → B → C → A up to 20 times
4. **Headers may be stripped**: Some servers strip headers on redirect

## Future Enhancements

Potential improvements for future versions:

1. **Configurable max redirects**: Let users set their own limit
2. **Redirect loop detection**: Detect and warn about circular redirects
3. **Timing per hop**: Show time spent on each redirect hop
4. **Redirect visualization**: Graph view of redirect chain
5. **Redirect comparison**: Compare redirect chains across requests
6. **Export redirect chain**: Export as JSON, CSV, or cURL commands

## Troubleshooting

### Redirects Tab Not Appearing

**Possible causes**:
- No redirects occurred (direct response)
- Response failed before redirects could be captured
- Using HTTPS URL that doesn't redirect

**Solution**: Try with `http://` instead of `https://` to trigger protocol upgrade redirect.

### Too Many Redirects

**Error**: "Request failed" after many redirects

**Cause**: Hit the 20-redirect limit

**Solution**: Check for redirect loops or misconfigured server.

### Missing Redirect Information

**Issue**: Some redirect details are blank

**Cause**: Server didn't send complete redirect information

**Solution**: This is a server issue, not a client issue.

## Testing

Run the test suite to verify redirect tracking:

```bash
./test_redirects.sh
```

Test cases covered:
- No redirects (200 OK)
- Single 301 redirect (HTTP → HTTPS)
- Multiple redirects (301 → 302 → 200)
- Relative URL redirects
- www vs non-www redirects

## Summary

The redirect tracking feature provides comprehensive visibility into HTTP redirect chains, making it easy to debug authentication flows, URL shorteners, domain migrations, and more. With full integration into History and Repeater, redirect information is preserved for future reference and analysis.
