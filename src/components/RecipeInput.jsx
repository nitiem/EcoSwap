import { useState } from 'react';
import './RecipeInput.css';

const RecipeInput = ({ onAnalyze, isLoading = false }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // URL validation function
  const validateRecipeUrl = (inputUrl) => {
    // Reset previous state
    setError('');
    setIsValid(false);

    // Check if URL is empty
    if (!inputUrl.trim()) {
      return false;
    }

    try {
      const urlObj = new URL(inputUrl);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setError('Please enter a valid HTTP or HTTPS URL');
        return false;
      }

      // Basic hostname validation
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        setError('Please enter a valid website URL');
        return false;
      }

      setIsValid(true);
      return true;

    } catch (err) {
      setError('Please enter a valid URL (e.g., https://example.com/recipe)');
      return false;
    }
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Validate on every change (with debounce in real app)
    if (newUrl.trim()) {
      validateRecipeUrl(newUrl);
    } else {
      setError('');
      setIsValid(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateRecipeUrl(url) && onAnalyze) {
      onAnalyze(url);
    }
  };

  return (
    <div className="recipe-input-container">
      <div className="recipe-input-card">
        <div className="input-header">
          <h2>🌱 Analyze Your Recipe</h2>
          <p>Enter any recipe URL to discover vegan alternatives and reduce your environmental impact</p>
        </div>

        <form onSubmit={handleSubmit} className="recipe-form">
          <div className="input-group">
            <label htmlFor="recipe-url" className="input-label">
              Recipe URL
            </label>
            <div className="input-wrapper">
              <input
                id="recipe-url"
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com/your-favorite-recipe"
                className={`recipe-input ${error ? 'error' : ''} ${isValid ? 'valid' : ''}`}
                disabled={isLoading}
              />
              {isValid && (
                <span className="validation-icon valid">✓</span>
              )}
              {error && (
                <span className="validation-icon error">⚠</span>
              )}
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="analyze-button"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Finding EcoSwaps...
              </>
            ) : (
              <>
                🌱 EcoSwaps
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecipeInput;
