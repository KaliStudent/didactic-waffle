import React, { useState } from 'react';
import axios from 'axios';
import './CyberOverlay.css';

const BACKEND_URL = 'http://localhost:3000';

const dummyTlds = [
  '.com', '.net', '.org', '.io', '.app', '.dev', '.xyz', '.co', '.ai', '.tech',
  '.academy', '.art', '.blog', '.cloud', '.data', '.design', '.digital', '.email',
  '.expert', '.finance', '.fund', '.games', '.global', '.group', '.host', '.info'
];

const DomainSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [useWhoisPrivacy, setUseWhoisPrivacy] = useState(false);
  const [useRapidSSL, setUseRapidSSL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkDomainAvailability = async (domains) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/check-availability`, {
        domainNames: domains,
      });
      // The API returns a results array, let's process it
      const results = response.data.results.map(res => ({
        domainName: res.domainName,
        // Name.com API v4/v1 uses 'purchasable' boolean. Fallback to availability string if needed.
        isAvailable: res.purchasable === true, 
        price: res.purchasePrice ? res.purchasePrice.toFixed(2) : 'N/A',
        isPremium: res.premium
      }));
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setError('Failed to check domain availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm) {
      // Improve input sanitization: remove existing extension if the user typed one
      // e.g., "google.com" -> "google"
      const cleanTerm = searchTerm.split('.')[0].replace(/ /g, '');
      
      console.log('Sanitized term:', cleanTerm);
      const domainsToCheck = dummyTlds.map(tld => cleanTerm + tld);
      console.log('Domains to check:', domainsToCheck);
      checkDomainAvailability(domainsToCheck);
    }
  };

  const handleAddToCart = (domain) => {
    setSelectedDomain(domain);
  };

  const handleCheckout = async () => {
    if (!selectedDomain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/domain/register`, {
        domainName: selectedDomain.domainName,
        years: 1, // Example: hardcoded to 1 year
        purchasePrice: selectedDomain.price,
        useWhoisPrivacy,
        useSSL: useRapidSSL,
      });
      console.log('Registration successful:', response.data);
      alert('Domain registration simulated successfully!');
      setSelectedDomain(null);
      setUseWhoisPrivacy(false);
      setUseRapidSSL(false);
      setSearchResults([]);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError('Domain registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-inner">
        <h3>Find Your Perfect Domain</h3>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="domain-input"
            placeholder="ENTER_QUERY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" disabled={loading}>SEARCH</button>
        </form>

        {loading && <p style={{color: '#00f2ff'}}>SCANNING_DATABASE...</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="tld-suggestions">
          {dummyTlds.map(tld => (
            <span key={tld} className="tld-badge" onClick={() => setSearchTerm(prev => prev.split('.')[0] + tld)}>
              {tld}
            </span>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>AVAILABLE_TARGETS:</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="domain-result">
                <span>{result.domainName}</span>
                {result.isAvailable ? (
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <span style={{ color: '#00f2ff' }}> [AVAILABLE]</span>
                    {result.price !== 'N/A' && <span> ${result.price}</span>}
                    <button style={{padding: '5px 10px', fontSize: '0.8rem'}} onClick={() => handleAddToCart(result)} disabled={!!selectedDomain}>ADD</button>
                  </div>
                ) : (
                  <span style={{ color: '#ff0055' }}> [TAKEN]</span>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedDomain && (
          <div className="checkout-section">
            <h4>CART_CONTENTS: {selectedDomain.domainName}</h4>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={useWhoisPrivacy} 
                  onChange={(e) => setUseWhoisPrivacy(e.target.checked)} 
                />
                ENABLE_WHOIS_PRIVACY_SHIELD
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={useRapidSSL} 
                  onChange={(e) => setUseRapidSSL(e.target.checked)} 
                />
                DEPLOY_RAPID_SSL_CERT
              </label>
            </div>
            <button onClick={handleCheckout} disabled={loading} style={{marginTop: '10px', width: '100%'}}>INITIALIZE_REGISTRATION</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainSearch;