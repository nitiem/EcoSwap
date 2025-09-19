// Convert from ES6 import to CommonJS for Azure Functions
const natural = require('natural');

class IngredientAnalyzer {
  constructor() {
    // Database of non-vegan ingredients and their vegan alternatives
    this.nonVeganIngredients = {
      // Dairy products
      'milk': {
        alternatives: ['oat milk', 'almond milk', 'soy milk', 'coconut milk'],
        defaultAlternative: 'oat milk',
        ratio: '1:1',
        notes: 'Oat milk works best for creamy textures, almond for lighter dishes'
      },
      'butter': {
        alternatives: ['vegan butter', 'coconut oil', 'olive oil'],
        defaultAlternative: 'vegan butter',
        ratio: '1:1',
        notes: 'Use coconut oil for baking, olive oil for savory dishes'
      },
      'cream': {
        alternatives: ['coconut cream', 'cashew cream', 'oat cream'],
        defaultAlternative: 'coconut cream',
        ratio: '1:1',
        notes: 'Coconut cream for desserts, cashew cream for savory dishes'
      },
      'cheese': {
        alternatives: ['nutritional yeast', 'vegan cheese', 'cashew cheese'],
        defaultAlternative: 'vegan cheese',
        ratio: '1:1',
        notes: 'Nutritional yeast for cheesy flavor, vegan cheese for melting'
      },
      'yogurt': {
        alternatives: ['coconut yogurt', 'almond yogurt', 'soy yogurt'],
        defaultAlternative: 'coconut yogurt',
        ratio: '1:1',
        notes: 'Coconut yogurt for thickness, soy yogurt for protein'
      },
      'sour cream': {
        alternatives: ['cashew sour cream', 'coconut sour cream'],
        defaultAlternative: 'cashew sour cream',
        ratio: '1:1',
        notes: 'Blend cashews with lemon juice for homemade version'
      },

      // Eggs
      'egg': {
        alternatives: ['flax egg', 'chia egg', 'aquafaba', 'applesauce'],
        defaultAlternative: 'flax egg',
        ratio: '1 egg = 1 tbsp ground flax + 3 tbsp water',
        notes: 'Flax eggs for binding, aquafaba for whipping, applesauce for moisture'
      },
      'eggs': {
        alternatives: ['flax eggs', 'chia eggs', 'aquafaba', 'applesauce'],
        defaultAlternative: 'flax eggs',
        ratio: '1 egg = 1 tbsp ground flax + 3 tbsp water',
        notes: 'Flax eggs for binding, aquafaba for whipping, applesauce for moisture'
      },

      // Add more ingredients here following the same pattern...
      // (abbreviated for brevity - you can copy the full content from your original file)
    };

    // Initialize stemmer
    this.stemmer = natural.PorterStemmer;
  }

  // Add all your existing methods here...
  // (Copy from your original ingredientAnalyzer.js file)
  
  analyzeIngredients(ingredients) {
    // Copy your implementation
    return {};
  }

  generateEcoSwappedRecipe(recipe, alternatives) {
    // Copy your implementation
    return null;
  }

  getEnvironmentalImpact(alternatives) {
    // Copy your implementation
    return {};
  }
}

module.exports = IngredientAnalyzer;