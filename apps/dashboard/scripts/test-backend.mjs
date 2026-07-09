#!/usr/bin/env node

/**
 * Backend Connection Test Script
 * Tests connectivity to VPS backend and validates API responses
 */

import fetch from 'node-fetch';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE = `${BACKEND_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n⏳ Testing: ${name}`, 'blue');
    await fn();
    log(`✅ PASS: ${name}`, 'green');
    return true;
  } catch (err) {
    log(`❌ FAIL: ${name}`, 'red');
    log(`   Error: ${err.message}`, 'red');
    return false;
  }
}

async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Health check failed');
}

async function getStats() {
  const res = await fetch(`${API_BASE}/admin/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success && !data.data) throw new Error('No stats data');
  log(`   Found stats: ${JSON.stringify(data.data || {}).substring(0, 100)}...`, 'blue');
}

async function getUsers() {
  const res = await fetch(`${API_BASE}/admin/users?page=1&limit=5`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.users || data.data)) throw new Error('Invalid users response');
  log(`   Found ${(data.users || data.data || []).length} users`, 'blue');
}

async function getDevices() {
  const res = await fetch(`${API_BASE}/admin/devices?page=1&limit=5`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.devices || data.data)) throw new Error('Invalid devices response');
  log(`   Found ${(data.devices || data.data || []).length} devices`, 'blue');
}

async function getMobileSubscription() {
  // This would normally require a valid token, so we expect 401 if no auth
  const res = await fetch(`${API_BASE}/mobile/subscription`);
  if (res.status === 401) {
    log(`   Received 401 (expected without auth)`, 'blue');
    return;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function corsCheck() {
  const res = await fetch(`${API_BASE}/health`);
  const corsHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
  ];
  const hasCors = corsHeaders.some(h => res.headers.has(h));
  if (!hasCors) {
    log(`   ⚠️  CORS headers not detected (may cause issues)`, 'yellow');
  } else {
    log(`   CORS headers detected`, 'blue');
  }
}

async function runTests() {
  log('\n🚀 Backend Connection Test Suite\n', 'blue');
  log(`Backend URL: ${BACKEND_URL}`, 'blue');
  log(`API Base: ${API_BASE}\n`, 'blue');

  const results = [];

  // Basic connectivity
  results.push(await test('Backend Health Check', healthCheck));
  results.push(await test('CORS Configuration', corsCheck));

  // Admin endpoints
  results.push(await test('Get Stats (Admin)', getStats));
  results.push(await test('Get Users (Admin)', getUsers));
  results.push(await test('Get Devices (Admin)', getDevices));

  // Mobile endpoints
  results.push(await test('Get Subscription (Mobile)', getMobileSubscription));

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  if (percentage === 100) {
    log(`✅ All tests passed! (${passed}/${total})`, 'green');
    process.exit(0);
  } else if (percentage >= 50) {
    log(`⚠️  Some tests failed (${passed}/${total} - ${percentage}%)`, 'yellow');
    process.exit(1);
  } else {
    log(`❌ Most tests failed (${passed}/${total} - ${percentage}%)`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  log(`\n❌ Test suite error: ${err.message}`, 'red');
  process.exit(1);
});
