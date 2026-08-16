# Quick Guide: Using Your akshay_cookie Variable

## Your Current Setup ✅

**Environment:** Testing (ACTIVE)  
**Variable:** `akshay_cookie`  
**Value:** `this_is_akshay_cookie_value`

Since your "Testing" environment is already active, you can use `{{akshay_cookie}}` anywhere in your requests.

---

## How to Use It

### Option 1: As a Cookie Header (Most Common)

**In the Request Pane → Headers tab:**

| Enabled | Name | Value |
|---------|------|-------|
| ☑️ | `Cookie` | `{{akshay_cookie}}` |

**What gets sent:**
```
Cookie: this_is_akshay_cookie_value
```

---

### Option 2: As a Session Cookie (With Cookie Name)

| Enabled | Name | Value |
|---------|------|-------|
| ☑️ | `Cookie` | `sessionid={{akshay_cookie}}` |

**What gets sent:**
```
Cookie: sessionid=this_is_akshay_cookie_value
```

---

### Option 3: As Authorization Bearer Token

| Enabled | Name | Value |
|---------|------|-------|
| ☑️ | `Authorization` | `Bearer {{akshay_cookie}}` |

**What gets sent:**
```
Authorization: Bearer this_is_akshay_cookie_value
```

---

### Option 4: In the URL

```
https://api.example.com/data?token={{akshay_cookie}}
```

**Becomes:**
```
https://api.example.com/data?token=this_is_akshay_cookie_value
```

---

### Option 5: In Request Body (JSON)

```json
{
  "auth_token": "{{akshay_cookie}}",
  "user_id": 123
}
```

**Becomes:**
```json
{
  "auth_token": "this_is_akshay_cookie_value",
  "user_id": 123
}
```

---

## Step-by-Step Example

Let's test your cookie with HTTPBin:

1. **Create a new request:**
   - Method: `GET`
   - URL: `https://httpbin.org/headers`

2. **Add header:**
   - Go to Headers tab
   - Add row:
     - Name: `Cookie`
     - Value: `{{akshay_cookie}}`
     - Enable: ✓

3. **Send request**

4. **Check response:**
   - Look in Response tab
   - You'll see:
     ```json
     {
       "headers": {
         "Cookie": "this_is_akshay_cookie_value"
       }
     }
     ```

This confirms the variable was interpolated correctly!

---

## Real-World Example: API Authentication

### Scenario: Your API requires a session cookie

```
GET https://api.yourapp.com/user/profile

Headers:
┌──────────────────────────────────────┐
│ Cookie: session={{akshay_cookie}}    │
│ Accept: application/json             │
└──────────────────────────────────────┘

Request sent:
Cookie: session=this_is_akshay_cookie_value
Accept: application/json
```

---

## Multiple Cookies

If you need to send multiple cookies in one request:

```
Cookie: session={{akshay_cookie}}; csrf_token={{csrf_token}}; user_id={{user_id}}
```

Just add more variables to your Testing environment first.

---

## Updating the Cookie Value

When you get a new cookie from a response:

### Method 1: Copy from Cookies Tab
1. Send a login request
2. Click **Cookies** tab in Response Pane
3. Click **Copy** button next to the cookie
4. Go to **Environments** page
5. Click on `akshay_cookie` value
6. Paste new value
7. Save

### Method 2: Manual Update
1. Go to **Environments** (left sidebar)
2. Click on "Testing" environment
3. Find `akshay_cookie` row
4. Click on the value field
5. Update to new value
6. Changes are saved automatically

---

## Verification Checklist

✅ Environment "Testing" is ACTIVE  
✅ Variable `akshay_cookie` is enabled (● green dot)  
✅ Value is set to `this_is_akshay_cookie_value`  
✅ Using `{{akshay_cookie}}` in headers/URL/body  
✅ Not using `{akshay_cookie}` or `${akshay_cookie}` (wrong syntax)

---

## Common Patterns

### Pattern 1: Standard Session Cookie
```
Header: Cookie
Value:  sessionid={{akshay_cookie}}
```

### Pattern 2: JWT Token
```
Header: Authorization
Value:  Bearer {{akshay_cookie}}
```

### Pattern 3: API Key
```
Header: X-API-Key
Value:  {{akshay_cookie}}
```

### Pattern 4: Custom Header
```
Header: X-Auth-Token
Value:  {{akshay_cookie}}
```

### Pattern 5: Query Parameter
```
URL: https://api.example.com/data?api_key={{akshay_cookie}}
```

---

## Testing Right Now

### Quick Test (30 seconds):

1. **Open Request Editor**
2. **URL:** `https://httpbin.org/anything`
3. **Method:** `GET`
4. **Add Header:**
   ```
   Name:  X-Test-Cookie
   Value: {{akshay_cookie}}
   ```
5. **Click Send**
6. **Check Response → JSON:**
   ```json
   {
     "headers": {
       "X-Test-Cookie": "this_is_akshay_cookie_value"
     }
   }
   ```

If you see `"this_is_akshay_cookie_value"` in the response, it's working! ✅

If you see `"{{akshay_cookie}}"` literally, check:
- Is "Testing" environment selected in the dropdown?
- Is the variable enabled (green dot)?
- Are you using double curly braces `{{` not single `{`?

---

## Pro Tip: Save Requests with Variables

When you save a request to a Collection:
- The variable syntax `{{akshay_cookie}}` is saved (not the actual value)
- If you update the cookie value later, saved requests use the new value automatically
- No need to edit multiple saved requests!

---

**You're all set!** Your `akshay_cookie` variable is ready to use. Just type `{{akshay_cookie}}` wherever you need it.
