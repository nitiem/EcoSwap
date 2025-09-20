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

      // Meat
      'chicken': {
        alternatives: ['tofu', 'tempeh', 'seitan', 'jackfruit'],
        defaultAlternative: 'tofu',
        ratio: '1:1 by weight',
        notes: 'Press tofu for better texture, marinate for flavor'
      },
      'beef': {
        alternatives: ['mushrooms', 'lentils', 'plant-based ground beef', 'walnuts'],
        defaultAlternative: 'mushrooms',
        ratio: '1:1 by weight',
        notes: 'Portobello mushrooms for steaks, lentils for ground beef'
      },
      'pork': {
        alternatives: ['jackfruit', 'mushrooms', 'tempeh'],
        defaultAlternative: 'jackfruit',
        ratio: '1:1 by weight',
        notes: 'Young jackfruit works great for pulled pork texture'
      },
      'bacon': {
        alternatives: ['coconut bacon', 'tempeh bacon', 'mushroom bacon'],
        defaultAlternative: 'tempeh bacon',
        ratio: '1:1 by weight',
        notes: 'Slice tempeh thin and marinate with soy sauce and maple syrup'
      },
      'ham': {
        alternatives: ['seitan', 'marinated tofu', 'jackfruit'],
        defaultAlternative: 'seitan',
        ratio: '1:1 by weight',
        notes: 'Marinate seitan in smoky spices for ham flavor'
      },

      // Fish and seafood
      'fish': {
        alternatives: ['tofu', 'banana peels', 'hearts of palm'],
        defaultAlternative: 'tofu',
        ratio: '1:1 by weight',
        notes: 'Marinate tofu in seaweed for fishy flavor'
      },
      'salmon': {
        alternatives: ['carrot lox', 'marinated tofu', 'king oyster mushrooms'],
        defaultAlternative: 'carrot lox',
        ratio: '1:1 by weight',
        notes: 'Thinly slice carrots and marinate in soy sauce and liquid smoke'
      },
      'tuna': {
        alternatives: ['chickpeas', 'jackfruit', 'lentils'],
        defaultAlternative: 'chickpeas',
        ratio: '1:1 by weight',
        notes: 'Mash chickpeas with vegan mayo and kelp powder'
      },
      'shrimp': {
        alternatives: ['king oyster mushrooms', 'hearts of palm'],
        defaultAlternative: 'king oyster mushrooms',
        ratio: '1:1 by weight',
        notes: 'Slice mushrooms and sauté for shrimp-like texture'
      },

      // Other animal products
      'honey': {
        alternatives: ['maple syrup', 'agave nectar', 'date syrup'],
        defaultAlternative: 'maple syrup',
        ratio: '1:1',
        notes: 'Maple syrup for baking, agave for beverages'
      },
      'gelatin': {
        alternatives: ['agar agar', 'carrageenan', 'pectin'],
        defaultAlternative: 'agar agar',
        ratio: '1 tsp agar = 1 tbsp gelatin',
        notes: 'Agar sets at room temperature, stronger than gelatin'
      },
      'worcestershire sauce': {
        alternatives: ['vegan worcestershire', 'soy sauce + tamarind'],
        defaultAlternative: 'vegan worcestershire',
        ratio: '1:1',
        notes: 'Check labels - traditional worcestershire contains anchovies'
      }
    };

    // Initialize stemmer for better ingredient matching
    this.stemmer = natural.PorterStemmer;
  }

  // Clean and normalize ingredient text
  normalizeIngredient(ingredient) {
    return ingredient
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
  }

  // Extract quantity and unit from ingredient
  parseQuantity(ingredient) {
    const quantityPattern = /^(\d+(?:\.\d+)?(?:\/\d+)?|\d+\/\d+)\s*(\w+)?\s+(.*)/;
    const match = ingredient.match(quantityPattern);
    
    if (match) {
      return {
        quantity: match[1],
        unit: match[2] || '',
        ingredient: match[3]
      };
    }
    
    return {
      quantity: '',
      unit: '',
      ingredient: ingredient
    };
  }

  // Find non-vegan ingredients in a recipe
  analyzeIngredients(ingredients) {
    const results = {
      nonVeganIngredients: [],
      veganAlternatives: [],
      analysisDetails: {
        totalIngredients: ingredients.length,
        nonVeganCount: 0,
        veganCount: 0,
        sustainabilityScore: 0
      }
    };

    for (const ingredient of ingredients) {
      const normalized = this.normalizeIngredient(ingredient);
      const parsed = this.parseQuantity(normalized);
      const ingredientText = parsed.ingredient;

      let foundMatch = null;
      let matchedKey = null;

      // Check for exact matches first
      for (const [key, data] of Object.entries(this.nonVeganIngredients)) {
        if (ingredientText.includes(key)) {
          foundMatch = data;
          matchedKey = key;
          break;
        }
      }

      // If no exact match, try stemmed matching
      if (!foundMatch) {
        const stemmedIngredient = this.stemmer.stem(ingredientText);
        for (const [key, data] of Object.entries(this.nonVeganIngredients)) {
          const stemmedKey = this.stemmer.stem(key);
          if (stemmedIngredient.includes(stemmedKey) || ingredientText.includes(key)) {
            foundMatch = data;
            matchedKey = key;
            break;
          }
        }
      }

      if (foundMatch) {
        results.nonVeganIngredients.push({
          original: ingredient,
          normalized: ingredientText,
          quantity: parsed.quantity,
          unit: parsed.unit,
          type: matchedKey,
          category: this.categorizeIngredient(matchedKey)
        });

        results.veganAlternatives.push({
          original: ingredient,
          originalType: matchedKey,
          alternatives: foundMatch.alternatives,
          recommended: foundMatch.defaultAlternative,
          ratio: foundMatch.ratio,
          notes: foundMatch.notes,
          quantity: parsed.quantity,
          unit: parsed.unit,
          carbonSavings: this.calculateCarbonSavings(matchedKey),
          waterSavings: this.calculateWaterSavings(matchedKey)
        });

        results.analysisDetails.nonVeganCount++;
      } else {
        results.analysisDetails.veganCount++;
      }
    }

    // Calculate sustainability score (0-100)
    results.analysisDetails.sustainabilityScore = this.calculateSustainabilityScore(results);

    return results;
  }

  categorizeIngredient(ingredient) {
    const categories = {
      dairy: ['milk', 'butter', 'cream', 'cheese', 'yogurt', 'sour cream'],
      eggs: ['egg', 'eggs'],
      meat: ['chicken', 'beef', 'pork', 'bacon', 'ham'],
      seafood: ['fish', 'salmon', 'tuna', 'shrimp'],
      other: ['honey', 'gelatin', 'worcestershire sauce']
    };

    for (const [category, items] of Object.entries(categories)) {
      if (items.includes(ingredient)) {
        return category;
      }
    }
    return 'other';
  }

  calculateCarbonSavings(ingredient) {
    // Estimated CO2 savings in kg per serving (approximate values)
    const carbonSavings = {
      'beef': 2.5,
      'pork': 1.2,
      'chicken': 0.8,
      'fish': 0.6,
      'salmon': 1.1,
      'milk': 0.3,
      'butter': 0.9,
      'cheese': 0.8,
      'eggs': 0.2
    };
    return carbonSavings[ingredient] || 0.1;
  }

  calculateWaterSavings(ingredient) {
    // Estimated water savings in liters per serving (approximate values)
    const waterSavings = {
      'beef': 50,
      'pork': 25,
      'chicken': 15,
      'fish': 10,
      'salmon': 20,
      'milk': 5,
      'butter': 12,
      'cheese': 15,
      'eggs': 3
    };
    return waterSavings[ingredient] || 2;
  }

  calculateSustainabilityScore(results) {
    const total = results.analysisDetails.totalIngredients;
    const vegan = results.analysisDetails.veganCount;
    const nonVegan = results.analysisDetails.nonVeganCount;
    
    if (total === 0) return 0;
    
    // Base score from vegan percentage (0-60 points)
    let score = (vegan / total) * 60;
    
    // Bonus points for replacing high-impact ingredients
    const highImpactIngredients = ['beef', 'pork', 'lamb'];
    const mediumImpactIngredients = ['chicken', 'fish', 'salmon', 'milk', 'butter', 'cheese', 'cream', 'yogurt'];
    
    for (const alternative of results.veganAlternatives) {
      if (highImpactIngredients.includes(alternative.originalType)) {
        score += 15;
      } else if (mediumImpactIngredients.includes(alternative.originalType)) {
        score += 10;
      } else {
        score += 5;
      }
    }
    
    return Math.min(100, Math.round(score));
  }

  // Get detailed environmental impact
  getEnvironmentalImpact(alternatives) {
    let totalCarbonSavings = 0;
    let totalWaterSavings = 0;
    
    for (const alt of alternatives) {
      totalCarbonSavings += alt.carbonSavings;
      totalWaterSavings += alt.waterSavings;
    }
    
    return {
      carbonFootprintReduction: Math.round(totalCarbonSavings * 10) / 10,
      waterUsageReduction: Math.round(totalWaterSavings),
      landUseReduction: Math.round(totalCarbonSavings * 2), // Estimated
      biodiversityImpact: alternatives.length > 0 ? 'Positive' : 'Neutral'
    };
  }

  // Generate eco-swapped recipe with vegan substitutions
  generateEcoSwappedRecipe(recipe, alternatives) {
    if (!recipe || !alternatives) {
      return null;
    }

    // Create swapped ingredients list
    const swappedIngredients = recipe.ingredients.map(ingredient => {
      // Find if this ingredient has a vegan alternative
      const alternative = alternatives.find(alt => 
        ingredient.toLowerCase().includes(alt.originalType.toLowerCase()) ||
        alt.original.toLowerCase() === ingredient.toLowerCase()
      );

      if (alternative) {
        // Replace the ingredient with the recommended alternative
        let swappedIngredient = ingredient;
        const originalType = alternative.originalType;
        const recommended = alternative.recommended;
        
        // Replace the ingredient name while preserving quantity and units
        const regex = new RegExp(originalType, 'gi');
        swappedIngredient = swappedIngredient.replace(regex, recommended);
        
        return {
          original: ingredient,
          swapped: swappedIngredient,
          isSwapped: true,
          notes: alternative.notes
        };
      }

      return {
        original: ingredient,
        swapped: ingredient,
        isSwapped: false
      };
    });

    // Create swapped instructions by replacing ingredient names
    let swappedInstructions = recipe.instructions ? [...recipe.instructions] : [];
    
    // Replace ingredient names in instructions
    alternatives.forEach(alt => {
      const originalType = alt.originalType;
      const recommended = alt.recommended;
      const regex = new RegExp(originalType, 'gi');
      
      swappedInstructions = swappedInstructions.map(instruction => 
        instruction.replace(regex, recommended)
      );
    });

    return {
      title: recipe.title ? `EcoSwapped: ${recipe.title}` : 'EcoSwapped Recipe',
      description: recipe.description || '',
      servings: recipe.servings || '',
      prepTime: recipe.prepTime || '',
      cookTime: recipe.cookTime || '',
      totalTime: recipe.totalTime || '',
      ingredients: swappedIngredients,
      instructions: swappedInstructions,
      swapCount: alternatives.length,
      swapSummary: alternatives.map(alt => ({
        from: alt.originalType,
        to: alt.recommended,
        notes: alt.notes
      }))
    };
  }
}

module.exports = IngredientAnalyzer;
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