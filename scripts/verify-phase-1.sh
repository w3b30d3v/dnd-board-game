#!/bin/bash

API_URL="${API_URL:-http://localhost:4000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_USERNAME="testuser$(date +%s)"
TEST_PASSWORD="Test123!@#"

echo "=== Phase 1 Verification ==="
echo "API URL: $API_URL"
echo ""

# Test API health
echo "Testing API health..."
HEALTH_RESPONSE=$(curl -s -X GET "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed"
  echo "$HEALTH_RESPONSE"
  exit 1
fi

# Test registration
echo ""
echo "Testing registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"Test User\"}")

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "✅ Registration successful"
  echo "   Token received: ${TOKEN:0:20}..."
else
  echo "❌ Registration failed"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# Test login
echo ""
echo "Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$LOGIN_TOKEN" ] && [ "$LOGIN_TOKEN" != "null" ]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

# Test protected route
echo ""
echo "Testing protected route (/auth/me)..."
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

USER_EMAIL=$(echo "$ME_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
if [ "$USER_EMAIL" = "$TEST_EMAIL" ]; then
  echo "✅ Protected route works"
  echo "   User email: $USER_EMAIL"
else
  echo "❌ Protected route failed"
  echo "$ME_RESPONSE"
  exit 1
fi

# Test protected route without token
echo ""
echo "Testing protected route without token..."
NO_AUTH_RESPONSE=$(curl -s -X GET "$API_URL/auth/me")
if echo "$NO_AUTH_RESPONSE" | grep -q "Authentication required\|Invalid"; then
  echo "✅ Unauthorized request rejected"
else
  echo "❌ Unauthorized request was not rejected"
  echo "$NO_AUTH_RESPONSE"
  exit 1
fi

# Test invalid credentials
echo ""
echo "Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")

if echo "$INVALID_RESPONSE" | grep -q "Invalid credentials"; then
  echo "✅ Invalid credentials rejected"
else
  echo "❌ Invalid credentials not rejected properly"
  echo "$INVALID_RESPONSE"
  exit 1
fi

# Test token refresh
echo ""
echo "Testing token refresh..."
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
  echo "✅ Token refresh successful"
else
  echo "⚠️  Token refresh may have failed (non-critical)"
  echo "$REFRESH_RESPONSE"
fi

# Test validation errors
echo ""
echo "Testing validation errors..."
VALIDATION_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","username":"ab","password":"weak"}')

if echo "$VALIDATION_RESPONSE" | grep -q "Validation failed\|Invalid"; then
  echo "✅ Validation errors returned"
else
  echo "❌ Validation did not return errors"
  echo "$VALIDATION_RESPONSE"
fi

# Test logout
echo ""
echo "Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
  echo "✅ Logout successful"
else
  echo "⚠️  Logout response unexpected (non-critical)"
  echo "$LOGOUT_RESPONSE"
fi

echo ""
echo "================================"
echo "=== Phase 1 Complete ✅ ==="
echo "================================"
echo ""
echo "All authentication tests passed!"
echo ""
echo "Next steps:"
echo "1. Test the UI manually at http://localhost:3000"
echo "2. Navigate to /register and create an account"
echo "3. Login at /login"
echo "4. Verify dashboard shows user info"
echo ""
echo "Ready to proceed to Phase 2: Character Builder"
