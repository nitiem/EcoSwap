const RecipeScraper = require('../src/services/recipeScraper');
const IngredientAnalyzer = require('../src/services/ingredientAnalyzer');

let recipeScraper = null;
let ingredientAnalyzer = null;

// Lazy initialization functions
const getRecipeScraper = () => {
  if (!recipeScraper) {
    recipeScraper = new RecipeScraper();
  }
  return recipeScraper;
};

const getIngredientAnalyzer = () => {
  if (!ingredientAnalyzer) {
    ingredientAnalyzer = new IngredientAnalyzer();
  }
  return ingredientAnalyzer;
};

// Validate recipe URL
const validateRecipeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Invalid protocol. Use HTTP or HTTPS.' };
    }

    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { valid: false, error: 'Invalid hostname.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format.' };
  }
};

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
    return;
  }
  
  try {
    context.log('🔍 Recipe analysis request received');
    const { url } = req.body || {};

    if (!url) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: {
          success: false,
          error: 'Recipe URL is required',
          message: 'Please provide a valid recipe URL'
        }
      };
      return;
    }

    // Validate URL
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: {
          success: false,
          error: 'Invalid URL',
          message: validation.error
        }
      };
      return;
    }

    context.log(`🔍 Starting analysis for: ${url}`);

    // Scrape recipe data
    context.log('📄 Scraping recipe...');
    const recipeData = await getRecipeScraper().extractRecipeData(url);

    if (!recipeData || !recipeData.ingredients || recipeData.ingredients.length === 0) {
      context.res = {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: {
          success: false,
          error: 'Recipe extraction failed',
          message: 'Could not extract recipe ingredients from the provided URL.'
        }
      };
      return;
    }

    // Analyze ingredients for vegan alternatives
    context.log('🌱 Analyzing ingredients...');
    const analysis = getIngredientAnalyzer().analyzeIngredients(recipeData.ingredients);

    // Get environmental impact
    const environmentalImpact = getIngredientAnalyzer().getEnvironmentalImpact(analysis.veganAlternatives);

    // Generate eco-swapped recipe
    const ecoSwappedRecipe = getIngredientAnalyzer().generateEcoSwappedRecipe(recipeData, analysis.veganAlternatives);

    // Prepare response
    const response = {
      success: true,
      data: {
        recipe: {
          title: recipeData.title,
          description: recipeData.description,
          image: recipeData.image,
          sourceUrl: recipeData.sourceUrl,
          prepTime: recipeData.prepTime,
          cookTime: recipeData.cookTime,
          totalTime: recipeData.totalTime,
          servings: recipeData.servings,
          originalIngredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          extractionMethod: recipeData.extractionMethod,
          llmUsage: recipeData.llmUsage || null,
          scrapedAt: recipeData.scrapedAt
        },
        analysis: {
          totalIngredients: analysis.analysisDetails.totalIngredients,
          nonVeganIngredients: analysis.nonVeganIngredients,
          veganAlternatives: analysis.veganAlternatives,
          isVeganFriendly: analysis.nonVeganIngredients.length === 0,
          sustainabilityScore: analysis.analysisDetails.sustainabilityScore,
          analysisDetails: analysis.analysisDetails
        },
        environmentalImpact: {
          carbonFootprintReduction: environmentalImpact.carbonFootprintReduction,
          waterUsageReduction: environmentalImpact.waterUsageReduction,
          landUseReduction: environmentalImpact.landUseReduction
        },
        ecoSwappedRecipe: ecoSwappedRecipe
      }
    };

    context.log(`✅ Analysis complete: ${recipeData.title}`);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: response
    };

  } catch (error) {
    context.log.error('Recipe analysis error:', error.message);
    
    let errorMessage = 'An error occurred while analyzing the recipe.';
    let statusCode = 500;

    if (error.message.includes('Failed to scrape recipe')) {
      errorMessage = 'Could not extract recipe data from the provided URL.';
      statusCode = 422;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'The website took too long to respond. Please try again.';
      statusCode = 408;
    }

    context.res = {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: {
        success: false,
        error: 'Analysis failed',
        message: errorMessage
      }
    };
  }
};