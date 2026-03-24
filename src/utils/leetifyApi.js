const API_BASE_URL = process.env.LEETIFYAPI_BASE_URL || 'https://api-public.cs-prod.leetify.com';
const API_KEY = process.env.LEETIFYAPI_KEY;

if (!API_KEY) {
  throw new Error('LEETIFYAPI_KEY environment variable is required for Leetify integration.');
}

async function leetifyFetch(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[Leetify API] Requesting: ${url}`);

  const fetchFn = typeof fetch === 'function' ? fetch : require('node-fetch');

  const response = await fetchFn(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      _leetify_key: API_KEY,
      'Content-Type': 'application/json',
    },
  });

  console.log(`[Leetify API] Response Status: ${response.status}, OK: ${response.ok}`);
  console.log(`[Leetify API] Content-Type: ${response.headers.get('content-type')}`);

  if (response.status === 401) {
    throw new Error('Unauthorized: invalid Leetify API key.');
  }
  if (response.status === 404) {
    throw new Error('Not found.');
  }
  if (response.status === 429) {
    throw new Error('Rate limited. Please retry later.');
  }
  if (response.status >= 500) {
    throw new Error('Leetify API server error.');
  }

  if (!response.ok) {
    const payload = await response.text();
    console.error(`[Leetify API] Error ${response.status}:`, payload.substring(0, 100));
    throw new Error(`Leetify API error ${response.status}: ${payload}`);
  }

  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // For non-JSON responses (like text/plain), just return status success
    data = { status: response.status, ok: response.ok };
  }
  
  console.log(`[Leetify API] Response ${response.status} from ${endpoint}`);
  return data;
}

async function validateApiKey() {
  console.log('[Leetify] Validating API key...');
  const result = await leetifyFetch('/api-key/validate');
  console.log('[Leetify] API key validation successful');
  return result;
}

async function getPlayerProfile(steamId) {
  if (!steamId || typeof steamId !== 'string') {
    throw new Error('steamId is required.');
  }

  console.log(`[Leetify] Fetching profile for Steam ID: ${steamId}`);
  const profile = await leetifyFetch(`/v3/profile?steam64_id=${encodeURIComponent(steamId)}`);
  console.log(`[Leetify] Profile retrieved successfully`);
  return profile;
}

async function getMatchDetails(gameId) {
  if (!gameId || typeof gameId !== 'string') {
    throw new Error('gameId is required.');
  }

  console.log(`[Leetify] Fetching match details for game ID: ${gameId}`);
  const match = await leetifyFetch(`/v2/matches/${encodeURIComponent(gameId)}`);
  console.log(`[Leetify] Match details retrieved successfully`);
  return match;
}

module.exports = {
  validateApiKey,
  getPlayerProfile,
  getMatchDetails,
};