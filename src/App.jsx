import { useState } from 'react'
import './App.css'
import RecipeInput from './components/RecipeInput'
import apiService from './services/apiService'

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const [showEcoSwappedRecipe, setShowEcoSwappedRecipe] = useState(false)

  const handleRecipeAnalysis = async (url) => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)
    
    try {
      console.log('Analyzing recipe from URL:', url)
      
      // Call the real API
      const response = await apiService.analyzeRecipe(url)
      
      if (response.success) {
        setAnalysisResult(response.data)
        console.log('✅ Analysis successful:', response.data)
      } else {
        throw new Error(response.message || 'Analysis failed')
      }
      
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error.message || 'Failed to analyze recipe. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <div className="eco-header">
        <h1>🌱 EcoSwap</h1>
        <p className="tagline">Transform Any Recipe into a Vegan, Sustainable Alternative</p>
      </div>
      
      <div className="main-content">
        <RecipeInput 
          onAnalyze={handleRecipeAnalysis}
          isLoading={isAnalyzing}
        />

        {error && (
          <div className="error-result">
            <h2>❌ Analysis Failed</h2>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {analysisResult && (
          <div className="analysis-result">
            <h2>🌱 Your Recipe's Sustainability Score is {analysisResult.analysis.sustainabilityScore || 0}/100</h2>
            <div className="score-message">
              <p>
                {(analysisResult.analysis.sustainabilityScore || 0) >= 80 ? '🌟 Excellent sustainability!' :
                 (analysisResult.analysis.sustainabilityScore || 0) >= 60 ? '👍 Good eco-friendliness!' :
                 '🌱 Great potential for eco-swaps!'}
              </p>
              
              {/* Show Environmental Impact for lower scores */}
              {(analysisResult.analysis.sustainabilityScore || 0) < 60 && analysisResult.environmentalImpact && (
                <div className="environmental-impact">
                  <h3>🌍 Environmental Impact of EcoSwapped Recipe</h3>
                  <div className="impact-grid">
                    <div className="impact-item">
                      <span className="impact-value">
                        -{analysisResult.environmentalImpact.carbonFootprintReduction.toFixed(1)}kg
                      </span>
                      <span className="impact-label">CO2 Reduction</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-value">
                        -{analysisResult.environmentalImpact.waterUsageReduction.toFixed(1)}L
                      </span>
                      <span className="impact-label">Water Saved</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-value">
                        -{analysisResult.environmentalImpact.landUseReduction.toFixed(1)}m²
                      </span>
                      <span className="impact-label">Land Saved</span>
                    </div>
                  </div>
                </div>
              )}
              
              {analysisResult.analysis.veganAlternatives && analysisResult.analysis.veganAlternatives.length > 0 && (
                <p><strong>Here are the suggested EcoSwaps:</strong></p>
              )}
            </div>
            <div className="recipe-info">
              <h3>{analysisResult.recipe.title}</h3>
              {analysisResult.recipe.description && (
                <p className="recipe-description">{analysisResult.recipe.description}</p>
              )}
              <div className="recipe-meta">
                {analysisResult.recipe.servings && (
                  <span>🍽️ Serves: {analysisResult.recipe.servings}</span>
                )}
                {analysisResult.recipe.totalTime && (
                  <span>⏱️ Time: {analysisResult.recipe.totalTime}</span>
                )}
                {analysisResult.recipe.extractionMethod && (
                  <span>🔧 Method: {
                    analysisResult.recipe.extractionMethod === 'llm' ? 'LLM Analysis' :
                    analysisResult.recipe.extractionMethod === 'json-ld' ? 'Structured Data' :
                    analysisResult.recipe.extractionMethod === 'css-selectors' ? 'CSS Extraction' :
                    'Standard'
                  }</span>
                )}
                {analysisResult.recipe.llmUsage && (
                  <span className="llm-usage">🤖 LLM: {analysisResult.recipe.llmUsage.totalTokens} tokens (~${analysisResult.recipe.llmUsage.estimatedCost.toFixed(4)})</span>
                )}
              </div>
            </div>

            {analysisResult.recipe.originalIngredients && analysisResult.recipe.originalIngredients.length > 0 && (
              <div className="ecoswaps-table">
                <h3>🥗 Ingredients Table with Suggested EcoSwaps ({analysisResult.recipe.originalIngredients.length} ingredients)</h3>
                <table className="ingredients-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>EcoSwap Alternative</th>
                      <th>Ratio</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.recipe.originalIngredients.map((ingredient, index) => {
                      // Find if this ingredient has a vegan alternative
                      const veganAlt = analysisResult.analysis.veganAlternatives.find(alt => {
                        const altOriginal = alt.original?.toLowerCase() || '';
                        const altType = alt.originalType?.toLowerCase() || '';
                        const currentIngredient = ingredient.toLowerCase();
                        
                        // Check for exact match or if the alternative's original ingredient is contained in current ingredient
                        return altOriginal === currentIngredient || 
                               currentIngredient.includes(altType) ||
                               altOriginal.includes(currentIngredient) ||
                               // Check if the ingredient contains the alternative type (e.g., "ground beef" contains "beef")
                               (altType && currentIngredient.includes(altType));
                      });
                      
                      return (
                        <tr key={index} className={veganAlt ? 'needs-swap' : 'already-vegan'}>
                          <td className="ingredient-name" data-label="Ingredient">
                            {ingredient}
                          </td>
                          <td className="quantity" data-label="Quantity">
                            {veganAlt?.quantity && veganAlt?.unit ? 
                              `${veganAlt.quantity} ${veganAlt.unit}` : 
                              'As listed'
                            }
                          </td>
                          <td className="status" data-label="Status">
                            {veganAlt ? (
                              <span className="needs-replacement">🔄 Needs EcoSwap</span>
                            ) : (
                              <span className="already-good">✅ Already Eco-Friendly</span>
                            )}
                          </td>
                          <td className="alternative-ingredient" data-label="EcoSwap Alternative">
                            {veganAlt ? 
                              (veganAlt.recommended || veganAlt.alternatives?.[0]) :
                              <span className="no-change">No change needed</span>
                            }
                          </td>
                          <td className="ratio" data-label="Ratio">
                            {veganAlt?.ratio || '-'}
                          </td>
                          <td className="notes" data-label="Notes">
                            {veganAlt?.notes || 'Keep as is - already sustainable!'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Share and Action Buttons */}
            <div className="action-buttons">
              <button 
                onClick={() => setAnalysisResult(null)} 
                className="new-analysis-button"
              >
                🔄 Analyze Another Recipe
              </button>
              {analysisResult.ecoSwappedRecipe && (
                <button 
                  onClick={() => setShowEcoSwappedRecipe(true)} 
                  className="eco-recipe-button"
                >
                  🌱 View EcoSwapped Recipe
                </button>
              )}
            </div>
          </div>
        )}

        {!analysisResult && !isAnalyzing && (
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <h3>Smart Analysis</h3>
              <p>AI-powered ingredient recognition and vegan alternative suggestions</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <h3>Environmental Impact</h3>
              <p>See how your vegan swaps reduce carbon footprint and water usage</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💚</span>
              <h3>Nutritional Balance</h3>
              <p>Maintain nutritional value while making sustainable choices</p>
            </div>
          </div>
        )}
      </div>

      {/* EcoSwapped Recipe Modal */}
      {showEcoSwappedRecipe && analysisResult?.ecoSwappedRecipe && (
        <div className="modal-overlay" onClick={() => setShowEcoSwappedRecipe(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🌱 {analysisResult.ecoSwappedRecipe.title}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEcoSwappedRecipe(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Recipe Info */}
              <div className="recipe-info">
                {analysisResult.ecoSwappedRecipe.description && (
                  <p className="recipe-description">{analysisResult.ecoSwappedRecipe.description}</p>
                )}
                
                <div className="recipe-meta">
                  {analysisResult.ecoSwappedRecipe.servings && (
                    <span>🍽️ Serves: {analysisResult.ecoSwappedRecipe.servings}</span>
                  )}
                  {analysisResult.ecoSwappedRecipe.prepTime && (
                    <span>⏱️ Prep: {analysisResult.ecoSwappedRecipe.prepTime}</span>
                  )}
                  {analysisResult.ecoSwappedRecipe.totalTime && (
                    <span>⏰ Total: {analysisResult.ecoSwappedRecipe.totalTime}</span>
                  )}
                </div>
              </div>

              {/* Swap Summary */}
              {analysisResult.ecoSwappedRecipe.swapCount > 0 && (
                <div className="swap-summary">
                  <h3>🔄 EcoSwaps Made ({analysisResult.ecoSwappedRecipe.swapCount})</h3>
                  <div className="swap-list">
                    {analysisResult.ecoSwappedRecipe.swapSummary.map((swap, index) => (
                      <div key={index} className="swap-item">
                        <span className="swap-from">{swap.from}</span>
                        <span className="swap-arrow">→</span>
                        <span className="swap-to">{swap.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              <div className="recipe-section">
                <h3>🥕 Ingredients</h3>
                <ul className="ingredients-list">
                  {analysisResult.ecoSwappedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className={ingredient.isSwapped ? 'swapped' : 'original'}>
                      {ingredient.swapped}
                      {ingredient.isSwapped && <span className="swap-badge">EcoSwapped!</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              {analysisResult.ecoSwappedRecipe.instructions && analysisResult.ecoSwappedRecipe.instructions.length > 0 && (
                <div className="recipe-section">
                  <h3>👩‍🍳 Instructions</h3>
                  <ol className="instructions-list">
                    {analysisResult.ecoSwappedRecipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
