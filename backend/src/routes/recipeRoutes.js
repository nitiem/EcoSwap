import express from 'express';
import RecipeScraper from '../scrapers/recipeScraper.js';
import IngredientAnalyzer from '../services/ingredientAnalyzer.js';

const router = express.Router();
let recipeScraper = null;
let ingredientAnalyzer = null;

// Lazy initialization function
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

// Validate recipe URL - Updated to accept any valid URL
const validateRecipeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Only check for valid HTTP/HTTPS protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Invalid protocol. Use HTTP or HTTPS.' };
    }

    // Basic hostname validation
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { valid: false, error: 'Invalid hostname.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format.' };
  }
};

// POST /api/recipes/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Recipe URL is required',
        message: 'Please provide a valid recipe URL'
      });
    }

    // Validate URL
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL',
        message: validation.error
      });
    }

    console.log(`🔍 Starting analysis for: ${url}`);

    // Scrape recipe data
    console.log('📄 Scraping recipe...');
    const recipeData = await getRecipeScraper().scrapeRecipe(url);

    if (!recipeData || !recipeData.ingredients || recipeData.ingredients.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Recipe extraction failed',
        message: 'Could not extract recipe ingredients from the provided URL. The site may not contain recipe data or may require JavaScript to load content.'
      });
    }

    // Analyze ingredients for vegan alternatives
    console.log('🌱 Analyzing ingredients...');
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

    console.log(`✅ Analysis complete: ${recipeData.title}`);
    console.log(`🌱 Found ${analysis.nonVeganIngredients.length} non-vegan ingredients`);
    console.log(`📊 Sustainability score: ${analysis.sustainabilityScore}/100`);

    res.json(response);

  } catch (error) {
    console.error('Recipe analysis error:', error.message);
    
    // Enhanced error handling for different types of failures
    let errorMessage = 'An error occurred while analyzing the recipe.';
    let statusCode = 500;

    if (error.message.includes('Failed to scrape recipe')) {
      errorMessage = 'Could not extract recipe data from the provided URL. The site may not contain recipe information, may require JavaScript, or may be blocking automated access.';
      statusCode = 422;
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorMessage = 'The website took too long to respond. Please try again or try a different URL.';
      statusCode = 408;
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      errorMessage = 'Could not reach the website. Please check the URL and try again.';
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: 'Analysis failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/recipes/supported-sites
router.get('/supported-sites', (req, res) => {
  const sites = [
    {
      name: 'AllRecipes',
      domain: 'allrecipes.com',
      description: 'Popular recipe sharing platform'
    },
    {
      name: 'Food Network',
      domain: 'foodnetwork.com',
      description: 'Professional recipes from TV chefs'
    },
    {
      name: 'Epicurious',
      domain: 'epicurious.com',
      description: 'Gourmet recipes and cooking tips'
    },
    {
      name: 'Simply Recipes',
      domain: 'simplyrecipes.com',
      description: 'Simple, tested recipes'
    },
    {
      name: 'Eating Well',
      domain: 'eatingwell.com',
      description: 'Healthy recipe collection'
    },
    {
      name: 'Universal Support',
      domain: 'Any recipe website',
      description: 'EcoSwap can analyze recipes from most food blogs and recipe sites using advanced extraction techniques'
    }
  ];

  res.json({
    success: true,
    data: {
      message: 'EcoSwap supports most recipe websites',
      supportedSites: sites,
      note: 'While we have optimized support for popular sites, our AI-powered extraction can handle most recipe websites, including personal food blogs and international sites.'
    }
  });
});

// GET /api/recipes/validate-url
router.get('/validate-url', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }

  const validation = validateRecipeUrl(url);
  
  res.json({
    success: true,
    data: {
      valid: validation.valid,
      url: url,
      message: validation.valid ? 
        'URL is valid and ready for analysis' : 
        validation.error
    }
  });
});

export default router;