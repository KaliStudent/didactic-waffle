const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const app = express();
app.use(cors());
app.use(express.json());

// Load credentials from environment variables
const NAME_COM_URL = process.env.NAMEDOTCOM_API_URL || 'https://api.name.com/core/v1';
const AUTH_HEADER = `Basic ${process.env.NAMEDOTCOM_AUTH}`; 

// Log to check if environment variables are loaded (for debugging)
console.log('NAME_COM_URL:', NAME_COM_URL);
console.log('AUTH_HEADER (partial):', AUTH_HEADER ? AUTH_HEADER.substring(0, 30) + '...' : 'Not loaded');


// Endpoint to check domain availability
app.post('/api/check-availability', async (req, res) => {
    try {
        const { domainNames } = req.body;
        const response = await axios.post(`${NAME_COM_URL}/domains:checkAvailability`, 
            { domainNames }, 
            { headers: { 'Authorization': AUTH_HEADER } }
        );
        console.log('API Response:', JSON.stringify(response.data, null, 2));
        res.json(response.data);
    } catch (error) {
        console.error('Error checking domain availability:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch from Name.com' });
    }
});

// Endpoint to get TLD pricing
app.get('/api/tlds', async (req, res) => {
    try {
        const response = await axios.get(`${NAME_COM_URL}/tlds`, {
            headers: { 'Authorization': AUTH_HEADER }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching TLDs:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch TLDs' });
    }
});

// Endpoint to register a domain (simplified for example)
app.post('/api/domain/register', async (req, res) => {
  const { domainName, years, useWhoisPrivacy, useSSL } = req.body;

  const payload = {
    domain: { domainName: domainName },
    purchasePrice: 12.99, // This should ideally come from a TLD pricing lookup
    years: years,
    addons: []
  };

  if (useWhoisPrivacy) payload.addons.push({ type: 'privacy' });
  // Note: 'ssl' addon type and product name 'RapidSSL' might need to be
  // verified against Name.com API documentation. This is an example.
  if (useSSL) payload.addons.push({ type: 'ssl', product: 'RapidSSL' }); 

  try {
    const response = await axios.post(`${NAME_COM_URL}/domains`, payload, {
      headers: { 'Authorization': AUTH_HEADER }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error registering domain:', error.response ? error.response.data : error.message);
    res.status(400).json({ error: error.response ? error.response.data : error.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));