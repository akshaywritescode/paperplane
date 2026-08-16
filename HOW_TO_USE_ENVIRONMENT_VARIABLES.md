# How to Use Environment Variables in Paperplane

## Overview
Environment variables allow you to reuse values across multiple requests. In your case, you have an `akshay_cookie` variable in your "testing" environment.

## Variable Syntax

Use **double curly braces** to reference environment variables:

```
{{variable_name}}
```

For your cookie variable:
```
{{akshay_cookie}}
```

## Where You Can Use Variables

Environment variables can be used in these places:

### 1. **URL Bar** ✅
```
https://api.example.com/users/{{user_id}}
```

### 2. **Query Parameters** ✅
```
Parameter Name:  session
Parameter Value: {{akshay_cookie}}
```

### 3. **Headers** ✅ (Most Common for Cookies)
```
Header Name:  Cookie
Header Value: {{akshay_cookie}}
```

Or for multiple cookies:
```
Header Name:  Cookie
Header Value: sessionid={{akshay_cookie}}; csrf_token={{csrf_token}}
```

### 4. **Request Body** ✅
```json
{
  "token": "{{akshay_cookie}}",
  "user": "{{username}}"
}
```

### 5. **Authorization Header** ✅
```
Header Name:  Authorization
Header Value: Bearer {{akshay_cookie}}
```

## Step-by-Step: Using Your Cookie Variable

### Method 1: As a Cookie Header (Recommended)

1. **Activate Your Environment**
   - Look at the top navigation bar
   - Find the environment selector dropdown
   - Select **"testing"** environment
   - This makes `{{akshay_cookie}}` available

2. **Add to Headers Tab**
   - In the Request Pane (left side), click **Headers** tab
   - Click **Add** or type in a new row
   - Set:
     - **Name**: `Cookie`
     - **Value**: `{{akshay_cookie}}`
     - **Enabled**: ✓ (checked)

3. **Send Request**
   - The `{{akshay_cookie}}` will be replaced with your actual cookie value
   - Server receives: `Cookie: <your-actual-cookie-value>`

### Method 2: As Authorization Bearer Token

If your cookie is actually a JWT token:

1. **Headers Tab**
   - **Name**: `Authorization`
   - **Value**: `Bearer {{akshay_cookie}}`
   - **Enabled**: ✓

### Method 3: In the URL

For APIs that accept tokens in the URL:

```
https://api.example.com/data?token={{akshay_cookie}}
```

### Method 4: Multiple Cookies

If you need to send multiple cookies:

```
Header Name:  Cookie
Header Value: session={{akshay_cookie}}; other_cookie={{other_var}}
```

## Visual Example

```
┌─────────────────────────────────────────────────────────────┐
│  Environment: [testing ▼]          <-- Select your env      │
├─────────────────────────────────────────────────────────────┤
│  GET | https://api.example.com/profile                      │
├──────────────────────────────┬──────────────────────────────┤
│  Request Pane                │  Response Pane               │
│                              │                              │
│  ┌────────────────────────┐  │                              │
│  │ Headers                │  │                              │
│  ├────────────────────────┤  │                              │
│  │ [✓] Cookie             │  │                              │
│  │     {{akshay_cookie}}  │  <-- Use variable here         │
│  │                        │  │                              │
│  │ [✓] Accept             │  │                              │
│  │     application/json   │  │                              │
│  └────────────────────────┘  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

## Verification: Check What's Being Sent

After sending a request, you can verify the interpolation worked:

1. **Check History**
   - Go to History view
   - Click on your request
   - Headers will show the **resolved value** (not the variable)

2. **Use HTTPBin for Testing**
   ```
   GET https://httpbin.org/headers
   
   Headers:
   Cookie: {{akshay_cookie}}
   ```
   
   The response will show you exactly what was sent.

## Common Use Cases for Cookies

### Use Case 1: Session-Based Auth
```
Header: Cookie
Value:  sessionid={{akshay_cookie}}
```

### Use Case 2: JWT in Cookie
```
Header: Cookie
Value:  jwt={{akshay_cookie}}; Path=/; HttpOnly
```

### Use Case 3: CSRF Token + Session
```
Header: Cookie
Value:  session={{session_cookie}}; csrf={{csrf_token}}
```

### Use Case 4: API Key
```
Header: X-API-Key
Value:  {{akshay_cookie}}
```

## Managing Your Variables

### View All Variables
1. Go to **Environments** page (left sidebar)
2. Click on **"testing"** environment
3. See all variables including `akshay_cookie`

### Edit Variable Value
1. Find `akshay_cookie` in the variables list
2. Click to edit the value
3. Save changes
4. All requests using `{{akshay_cookie}}` will use the new value

### Add More Variables
1. Click **Add Variable**
2. Set key and value
3. Use `{{your_key}}` in any request

### Enable/Disable Variables
- Use the checkbox next to each variable
- Disabled variables won't be interpolated (you'll see `{{akshay_cookie}}` literally)

## Pro Tips

### 💡 Tip 1: Test Interpolation
Create a test request to HTTPBin to see what's being sent:
```
GET https://httpbin.org/anything
Header: X-Test: {{akshay_cookie}}
```

The response will echo back the resolved value.

### 💡 Tip 2: Variable Chaining
You can reference variables in other variable values (if supported):
```
Variable 1: base_url = https://api.example.com
Variable 2: api_endpoint = {{base_url}}/users
```

### 💡 Tip 3: Multiple Environments
Create multiple environments for different scenarios:
- **testing** → `akshay_cookie = <test-value>`
- **production** → `akshay_cookie = <prod-value>`
- **staging** → `akshay_cookie = <staging-value>`

Switch between them to test different environments without changing your requests.

### 💡 Tip 4: Save Requests with Variables
When you save requests to Collections, the variable syntax (`{{akshay_cookie}}`) is saved, not the actual value. This means:
- ✅ Requests work across environments
- ✅ No sensitive data in saved requests
- ✅ Easy to share with team members

### 💡 Tip 5: Copy Cookies from Responses
After receiving a response with cookies:
1. Go to **Cookies** tab in Response Pane
2. Click the **Copy** button next to the cookie
3. Go to **Environments** page
4. Update `akshay_cookie` variable with the new value

## Troubleshooting

### Variable Not Replaced (Shows {{akshay_cookie}} Literally)

**Possible Causes:**

1. **Environment not selected**
   - Solution: Select "testing" from environment dropdown

2. **Variable is disabled**
   - Solution: Go to Environments, enable the checkbox for `akshay_cookie`

3. **Wrong variable name**
   - Variable names are case-sensitive
   - Check spelling: `{{akshay_cookie}}` not `{{Akshay_Cookie}}`

4. **Wrong syntax**
   - Must use double curly braces: `{{akshay_cookie}}`
   - Not single: `{akshay_cookie}` ❌
   - Not with dollar: `${akshay_cookie}` ❌

### Variable Value Not Updated

**Solution:** Click the **Refresh** button in Environments, or:
1. Go to Environments page
2. Make your edit
3. Return to Request Editor
4. The new value will be loaded

### Can't See Variable in Dropdown

Variables don't show in a dropdown (by design). You need to type:
```
{{akshay_cookie}}
```

**Future Enhancement:** Autocomplete suggestions while typing `{{` could be added.

## Security Notes

⚠️ **Important:**
- Environment variables are stored in your browser's localStorage
- They are **NOT encrypted**
- Do not share screenshots showing actual cookie values
- Rotate cookies/tokens regularly
- Use different values for testing vs production

## Quick Reference Card

| Task | Syntax |
|------|--------|
| Use variable | `{{variable_name}}` |
| In headers | `Cookie: {{akshay_cookie}}` |
| In URL | `https://api.com?token={{akshay_cookie}}` |
| In body | `{"token": "{{akshay_cookie}}"}` |
| Multiple cookies | `session={{sess}}; token={{tok}}` |

---

**Next Steps:**
1. Select "testing" environment from dropdown
2. Add a header: `Cookie: {{akshay_cookie}}`
3. Send a request to verify it works
4. Check the response to see if authentication succeeded

Need help? Try the HTTPBin test endpoint to see what's being sent:
```
GET https://httpbin.org/headers
Header: Cookie: {{akshay_cookie}}
```
