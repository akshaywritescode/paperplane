# Visual Guide: Using {{akshay_cookie}}

## Your Setup

```
┌─────────────────────────────────────────────────────────────┐
│ ENVIRONMENTS PAGE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📁 Testing [ACTIVE] ✓                                       │
│                                                              │
│  Variables:                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ● akshay_cookie = "this_is_akshay_cookie_value"      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### Step 1: You Type
```
┌─────────────────────────────────────────────────────────────┐
│ REQUEST EDITOR                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Headers:                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [✓] Cookie: {{akshay_cookie}}                        │   │
│  │                  ▲                                    │   │
│  │                  │                                    │   │
│  │             You type this                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Send] ◄─── Click here                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Paperplane Replaces
```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE SENDING REQUEST                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {{akshay_cookie}}                                           │
│         │                                                    │
│         │  Interpolation                                     │
│         ▼                                                    │
│  this_is_akshay_cookie_value                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Server Receives
```
┌─────────────────────────────────────────────────────────────┐
│ HTTP REQUEST SENT TO SERVER                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET /api/user/profile HTTP/1.1                              │
│  Host: api.example.com                                       │
│  Cookie: this_is_akshay_cookie_value                         │
│           ▲                                                  │
│           │                                                  │
│      Real value sent!                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Common Use Cases

### Use Case 1: Session Cookie
```
YOU TYPE:
┌──────────────────────────────────────┐
│ Cookie: sessionid={{akshay_cookie}}  │
└──────────────────────────────────────┘
          ↓
SERVER GETS:
┌────────────────────────────────────────────────────────┐
│ Cookie: sessionid=this_is_akshay_cookie_value          │
└────────────────────────────────────────────────────────┘
```

### Use Case 2: Bearer Token
```
YOU TYPE:
┌──────────────────────────────────────┐
│ Authorization: Bearer {{akshay_cookie}}│
└──────────────────────────────────────┘
          ↓
SERVER GETS:
┌──────────────────────────────────────────────────────────┐
│ Authorization: Bearer this_is_akshay_cookie_value        │
└──────────────────────────────────────────────────────────┘
```

### Use Case 3: Query Parameter
```
YOU TYPE:
┌─────────────────────────────────────────────────────────┐
│ https://api.example.com/data?token={{akshay_cookie}}    │
└─────────────────────────────────────────────────────────┘
          ↓
SERVER GETS:
┌──────────────────────────────────────────────────────────────────┐
│ https://api.example.com/data?token=this_is_akshay_cookie_value   │
└──────────────────────────────────────────────────────────────────┘
```

### Use Case 4: JSON Body
```
YOU TYPE:
┌──────────────────────────────────────┐
│ {                                    │
│   "token": "{{akshay_cookie}}"       │
│ }                                    │
└──────────────────────────────────────┘
          ↓
SERVER GETS:
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   "token": "this_is_akshay_cookie_value"             │
│ }                                                    │
└──────────────────────────────────────────────────────┘
```

## Complete Example: Making an Authenticated Request

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ENVIRONMENT SETUP                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Environment: Testing [ACTIVE]                                   │
│  Variable: akshay_cookie = "this_is_akshay_cookie_value"        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. REQUEST CONFIGURATION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Method: GET                                                     │
│  URL: https://api.yourapp.com/user/profile                       │
│                                                                  │
│  Headers:                                                        │
│    Cookie: {{akshay_cookie}}                                     │
│    Accept: application/json                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. INTERPOLATION (Automatic)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cookie: {{akshay_cookie}}                                       │
│              ↓                                                   │
│  Cookie: this_is_akshay_cookie_value                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. HTTP REQUEST SENT                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET /user/profile HTTP/1.1                                      │
│  Host: api.yourapp.com                                           │
│  Cookie: this_is_akshay_cookie_value                             │
│  Accept: application/json                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SERVER RESPONSE                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP/1.1 200 OK                                                 │
│  Content-Type: application/json                                  │
│                                                                  │
│  {                                                               │
│    "id": 123,                                                    │
│    "name": "Akshay",                                             │
│    "email": "akshay@example.com"                                 │
│  }                                                               │
│                                                                  │
│  ✅ Authentication successful!                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Syntax:     {{akshay_cookie}}                             │
│              ^^             ^^                             │
│              │              │                              │
│              └──────────────┘                              │
│           Must use DOUBLE curly braces                     │
│                                                            │
│  ❌ Wrong: {akshay_cookie}      (single braces)            │
│  ❌ Wrong: ${akshay_cookie}     (dollar sign)              │
│  ❌ Wrong: {{akshay-cookie}}    (wrong name)               │
│  ❌ Wrong: {{ akshay_cookie }}  (spaces - OK but not needed)│
│  ✅ Right: {{akshay_cookie}}                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Troubleshooting Flow

```
Is {{akshay_cookie}} not being replaced?
│
├─► Check: Is "Testing" environment ACTIVE?
│   │
│   ├─ NO → Select "Testing" from dropdown
│   │
│   └─ YES → Continue ▼
│
├─► Check: Is variable enabled (● green dot)?
│   │
│   ├─ NO → Enable it in Environments page
│   │
│   └─ YES → Continue ▼
│
├─► Check: Using correct syntax {{akshay_cookie}}?
│   │
│   ├─ NO → Fix to use double curly braces
│   │
│   └─ YES → Continue ▼
│
└─► Check: Variable name spelled correctly?
    │
    ├─ NO → Fix spelling (case-sensitive!)
    │
    └─ YES → Contact support (rare edge case)
```

---

## TL;DR - Do This Now

1. ✅ Your "Testing" environment is already ACTIVE
2. ✅ Your variable `akshay_cookie` is set up
3. Type this in any header: `{{akshay_cookie}}`
4. Send request
5. It becomes: `this_is_akshay_cookie_value`
6. Done! 🎉
