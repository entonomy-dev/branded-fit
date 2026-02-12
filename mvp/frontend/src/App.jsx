import React, { useState } from 'react';
import axios from 'axios';

// Step display names
const STEP_NAMES = {
  logoRetrieval: 'Retrieving company logo',
  logoDownload: 'Downloading logo image',
  imageUpload: 'Uploading to Printify',
  productCreation: 'Creating product mockup',
  productPublish: 'Publishing product',
  shopifyCreation: 'Creating Shopify listing',
};

function App() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    setLoading(true);
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      // Call the API to create the product
      const response = await axios.post('/api/products/create', {
        companyName: companyName.trim(),
      });

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to create product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setLoading(false);
    setProgress(null);
    setResult(null);
    setError(null);
  };

  const formatDuration = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Branded Fit</h1>
        <p>
          Create branded corporate apparel in minutes.
          <br />
          Just enter a company name and watch the magic happen.
        </p>
      </div>

      {!result && !error && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Microsoft, Apple, Tesla"
              disabled={loading}
              autoFocus
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Creating Product...' : 'Create Branded Product'}
          </button>
        </form>
      )}

      {loading && (
        <div className="progress-section">
          <div className="progress-title">Creating your branded product...</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '50%' }}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#666', marginTop: '15px' }}>
            This usually takes 30-60 seconds
          </p>
        </div>
      )}

      {result && (
        <div className="success-section">
          <h2>Product Created Successfully!</h2>
          <p>
            Your branded t-shirt for <strong>{result.companyName}</strong> is now live
            and ready for purchase.
          </p>
          <p style={{ fontSize: '0.95rem', marginBottom: '25px' }}>
            Time taken: {formatDuration(result.duration)}
          </p>
          <a
            href={result.shopifyProduct.url}
            target="_blank"
            rel="noopener noreferrer"
            className="product-link"
          >
            View Product on Shopify
          </a>
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleReset} className="reset-btn">
              Create Another Product
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-section">
          <h3>Error Creating Product</h3>
          <p>{error}</p>
          <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
            Common issues:
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Company logo not found - try a different company name or domain</li>
              <li>API credentials not configured - check your .env file</li>
              <li>Rate limit exceeded - wait a moment and try again</li>
            </ul>
          </p>
          <button onClick={handleReset} className="reset-btn">
            Try Again
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
        <p>Branded Fit MVP v1.0.0</p>
        <p style={{ marginTop: '5px' }}>
          Automated corporate apparel creation powered by Brandfetch, Printify, and Shopify
        </p>
      </div>
    </div>
  );
}

export default App;
