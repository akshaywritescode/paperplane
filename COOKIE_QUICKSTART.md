# Cookie Inspection - Quick Start Guide

## 🍪 Finding the Cookie Inspector

The cookie inspection feature is built into the Response Pane. Here's how to use it:

### Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│  Request Editor                                              │
├─────────────────────────────────────────────────────────────┤
│  Method: GET ▼  | https://api.example.com/login            │
│  [Send]                                                      │
├──────────────────────────────┬──────────────────────────────┤
│  Request Pane                │  Response Pane               │
│                              │                              │
│  • Params                    │  Status: 200 OK              │
│  • Headers                   │  Time: 245ms  Size: 1.2KB    │
│  • Body                      │                              │
│  • Auth                      │  ┌────────────────────────┐  │
│                              │  │ Response │ Headers │ 🍪 │  │
│                              │  └────────────────────────┘  │
│                              │         ↑                    │
│                              │    Click here!               │
│                              │                              │
│                              │  Cookie Details:             │
│                              │  ┌──────────────────────┐    │
│                              │  │ sessionid            │    │
│                              │  │ abc123               │ [📋]│
│                              │  │                      │    │
│                              │  │ Path: /              │    │
│                              │  │ HttpOnly ✓           │    │
│                              │  └──────────────────────┘    │
└──────────────────────────────┴──────────────────────────────┘
```

## Step-by-Step Instructions

### 1. Send a Request
- Enter a URL in the URL bar
- Click **Send** or press `Cmd/Ctrl + Enter`
- Wait for the response

### 2. Navigate to Cookies Tab
- Look at the response pane (right side)
- Click the **Cookies** tab (third tab, after Response and Headers)
- You'll see a 🍪 icon on the tab

### 3. View Cookie Details
Each cookie is displayed in a card showing:
- **Name** (bold text)
- **Value** (monospace font)
- **Copy button** (📋) - click to copy `name=value`
- **Attributes** (grid layout):
  - Domain
  - Path
  - Expires
  - Max-Age
  - HttpOnly flag (orange badge)
  - Secure flag (green badge)
  - SameSite

### 4. No Cookies?
If the response has no Set-Cookie headers, you'll see:
```
┌─────────────────────────────┐
│           🍪                │
│                             │
│       No cookies            │
│                             │
│  This response doesn't      │
│  contain any Set-Cookie     │
│  headers                    │
└─────────────────────────────┘
```

## Quick Test URLs

Try these URLs to see cookies in action:

### Simple Session Cookie
```
https://httpbin.org/response-headers?Set-Cookie=session%3Dabc123
```

### Secure Auth Cookie
```
https://httpbin.org/response-headers?Set-Cookie=auth%3Dtoken%3B%20Path%3D%2F%3B%20HttpOnly%3B%20Secure
```

### Cookie with Expiration
```
https://httpbin.org/response-headers?Set-Cookie=temp%3Dvalue%3B%20Max-Age%3D3600
```

## Tips & Tricks

### 🔍 Search Cookies
- Use the search bar at the bottom of the response pane
- Search terms will be highlighted in cookie names and values
- Press `Cmd/Ctrl + F` to focus the search bar

### 📋 Copy Cookies
- Click the copy button next to any cookie
- Copies in `name=value` format
- Great for debugging or manual testing

### 🔄 Compare Responses
- Use the **History** view to see previous responses
- Compare cookies across multiple requests
- Cookies are saved with each history entry

### ♻️ Replay Requests
- Send requests to the **Repeater** tab
- Cookies from responses are preserved
- Perfect for testing auth flows

### 💾 Save to Collections
- Save requests with the **Save** button
- Request configuration is saved (headers, body, auth)
- Note: Response cookies are NOT saved in collections (by design)

## Common Use Cases

### Debug Login Flow
1. Send POST request to `/login` endpoint
2. Check Cookies tab for session cookie
3. Verify HttpOnly and Secure flags are set
4. Copy cookie value for manual testing

### Check Cookie Expiration
1. Look for Expires or Max-Age attribute
2. Max-Age shown in seconds (with minutes in parentheses)
3. Expires shown as full date string

### Verify CSRF Token
1. Send request to get CSRF token
2. Check Cookies tab for csrf_token or similar
3. Copy value to include in next request

### Test Multi-Domain Cookies
1. Check Domain attribute in cookie details
2. Verify domain scoping is correct
3. Test with different subdomains

### Security Audit
1. Check all auth-related cookies have:
   - ✅ HttpOnly flag (prevents XSS)
   - ✅ Secure flag (HTTPS only)
   - ✅ SameSite attribute (CSRF protection)
2. Look for orange and green badges

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send request | `Cmd/Ctrl + Enter` |
| Search | `Cmd/Ctrl + F` |
| Navigate tabs | `Arrow keys` (when focused) |
| Close search | `Escape` |

## Troubleshooting

### "No cookies" showing but I expect cookies?
- Check if the API actually sets Set-Cookie headers
- Some APIs use Authorization headers instead of cookies
- CORS policies might strip Set-Cookie headers in browser
- Try the same request with curl to verify

### Cookies not persisted across requests?
- This is correct behavior - each request is independent
- Use Collections to save request configurations
- Use Repeater to manually replay with cookies

### Can't see cookie details?
- Make sure you're on the **Cookies** tab (not Response or Headers)
- Check if response was successful (200 OK)
- Verify the server sent Set-Cookie headers

## Advanced: Cookie Jar Feature (Future)

Currently, cookies are shown per-response. Future enhancements may include:
- Automatic cookie storage (like browsers)
- Cookie jar management
- Auto-send cookies on subsequent requests
- Cookie editor

For now, use the copy button and manually add cookies to request headers if needed.

---

**Need help?** Check the demo script: `./demo-cookies.sh`  
**Technical details?** See: `COOKIE_FEATURE_VERIFICATION.md`
