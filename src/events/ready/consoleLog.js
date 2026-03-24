const { validateApiKey } = require('../../utils/leetifyApi');

module.exports = async (client) => {
  console.log(`${client.user.tag} is online.`);
  
  try {
    console.log('[Startup] Validating Leetify API key...');
    await validateApiKey();
    console.log('[Startup] Leetify API key validated successfully.');
  } catch (err) {
    console.error('[Startup] Leetify API key validation failed:', err.message);
  }
};
