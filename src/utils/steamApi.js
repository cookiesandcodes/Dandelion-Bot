const API_KEY = process.env.STEAM_API_KEY;

if (!API_KEY) {
  throw new Error('STEAM_API_KEY environment variable is required for Steam API integration.');
}

async function steamFetch(endpoint, params = {}) {
  const url = new URL(`https://api.steampowered.com/${endpoint}`);
  url.searchParams.append('key', API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  }

  console.log(`[Steam API] Requesting: ${url.toString().replace(API_KEY, '***')}`);

  const fetchFn = typeof fetch === 'function' ? fetch : require('node-fetch');

  const response = await fetchFn(url.toString(), {
    headers: {
      accept: 'application/json',
    },
  });

  console.log(`[Steam API] Response Status: ${response.status}, OK: ${response.ok}`);

  if (!response.ok) {
    const payload = await response.text();
    console.error(`[Steam API] Error ${response.status}:`, payload.substring(0, 100));
    throw new Error(`Steam API error ${response.status}`);
  }

  const data = await response.json();
  return data;
}

function parseSteamInput(input) {
  // Check if it's a direct Steam64 ID (17 digits starting with 76561)
  if (/^\d{17}$/.test(input) && input.startsWith('76561')) {
    return { type: 'steam64', value: input };
  }

  // Check for profile URL with Steam64: steamcommunity.com/profiles/76561198...
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return { type: 'steam64', value: profileMatch[1] };
  }

  // Check for vanity URL: steamcommunity.com/id/customurl
  const vanityMatch = input.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (vanityMatch) {
    return { type: 'vanity', value: vanityMatch[1] };
  }

  // Default: treat as vanity URL
  return { type: 'vanity', value: input };
}

async function resolveVanityUrl(vanity) {
  console.log(`[Steam API] Resolving vanity URL: ${vanity}`);
  
  const result = await steamFetch('ISteamUser/ResolveVanityURL/v1/', {
    vanityurl: vanity,
    url_type: 1,
  });

  if (result.response.success !== 1) {
    throw new Error('Vanity URL not found.');
  }

  const steamId = result.response.steamid;
  console.log(`[Steam API] Resolved vanity "${vanity}" to Steam64: ${steamId}`);
  return steamId;
}

async function getPlayerSummary(steam64) {
  if (!steam64 || !/^\d{17}$/.test(steam64)) {
    throw new Error('Invalid Steam64 ID format.');
  }

  console.log(`[Steam API] Fetching player summary for: ${steam64}`);
  
  const result = await steamFetch('ISteamUser/GetPlayerSummaries/v2/', {
    steamids: steam64,
  });

  if (!result.response.players || result.response.players.length === 0) {
    throw new Error('Account not found.');
  }

  const player = result.response.players[0];

  // Check if profile is public (communityvisibilitystate === 3)
  if (player.communityvisibilitystate !== 3) {
    throw new Error('Profile is private (not public).');
  }

  console.log(`[Steam API] Player summary retrieved: ${player.personaname}`);
  
  return {
    displayName: player.personaname,
    avatar: player.avatarfull,
    steam64: player.steamid,
  };
}

module.exports = {
  parseSteamInput,
  resolveVanityUrl,
  getPlayerSummary,
};
