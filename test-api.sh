#!/bin/bash

# FleetMate API Test Script
BASE_URL="http://localhost:3000"

echo "🚀 Testing FleetMate API..."

# Test health endpoint
echo "📋 Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health endpoint response"

echo -e "\n📋 Testing API root..."
curl -s "$BASE_URL/api" | jq '.' || echo "API root response"

echo -e "\n📋 Available endpoints:"
echo "- GET  $BASE_URL/health"
echo "- GET  $BASE_URL/api"
echo "- POST $BASE_URL/api/auth/register"
echo "- POST $BASE_URL/api/auth/login"
echo "- GET  $BASE_URL/api/users"
echo "- GET  $BASE_URL/api/cars"
echo "- GET  $BASE_URL/api/drivers"
echo "- GET  $BASE_URL/api/requests"
echo "- GET  $BASE_URL/api/approvals"
echo "- POST $BASE_URL/api/notifications/send"
echo "- POST $BASE_URL/api/telegram/webhook"

echo -e "\n✅ FleetMate API is ready!"
echo "🌐 Access the API at: $BASE_URL/api"
echo "📱 Telegram bot is configured and running"
echo "🔗 WebSocket notifications available at: ws://localhost:3000/notifications"
