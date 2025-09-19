import * as cheerio from 'cheerio';
import axios from 'axios';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';

class RecipeScraper {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiRequestCount = 0;
    this.openaiDailyCost = 0;
    this.maxRequestsPerHour = parseInt(process.env.OPENAI_MAX_REQUESTS_PER_HOUR) || 50;
    this.maxDailyCost = parseFloat(process.env.OPENAI_MAX_DAILY_COST) || 2.00;
    this.lastResetTime = new Date();
    
    // Initialize OpenAI client
    this.openai = this.openaiApiKey ? new OpenAI({ apiKey: this.openaiApiKey }) : null;
    
    // Debug logging for API key
    console.log('🔧 RecipeScraper initialized');
    console.log('🔑 OpenAI API Key loaded:', !!this.openaiApiKey);
    console.log('🔑 API Key length:', this.openaiApiKey ? this.openaiApiKey.length : 0);
    console.log('🔑 API Key preview:', this.openaiApiKey ? `${this.openaiApiKey.substring(0, 15)}...` : 'undefined');
    console.log('🤖 OpenAI client initialized:', !!this.openai);
    console.log('📊 Max requests/hour:', this.maxRequestsPerHour);
    console.log('💰 Max daily cost:', this.maxDailyCost);
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // LLM-powered recipe extraction as fallback
  async extractRecipeWithLLM(html, url) {
    console.log('🔍 Checking OpenAI API key...');
    console.log('🔑 API Key exists:', !!this.openaiApiKey);
    console.log('🔑 API Key length:', this.openaiApiKey ? this.openaiApiKey.length : 0);
    console.log('🔑 API Key starts with sk-:', this.openaiApiKey ? this.openaiApiKey.startsWith('sk-') : false);
    console.log('🤖 OpenAI client exists:', !!this.openai);
    
    if (!this.openaiApiKey || this.openaiApiKey === 'your_openai_api_key_here' || !this.openai) {
      console.log('❌ OpenAI API key not configured or client not initialized. Skipping LLM extraction.');
      console.log('💡 To enable LLM fallback, add your OpenAI API key to the .env file');
      console.log('🔍 Current API key value:', this.openaiApiKey ? `${this.openaiApiKey.substring(0, 10)}...` : 'undefined');
      return null;
    }

    // Check usage limits
    const now = new Date();
    const hoursSinceReset = (now - this.lastResetTime) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 24) {
      // Reset daily counters
      this.openaiRequestCount = 0;
      this.openaiDailyCost = 0;
      this.lastResetTime = now;
    }

    if (this.openaiRequestCount >= this.maxRequestsPerHour) {
      console.log(`❌ OpenAI usage limit reached: ${this.openaiRequestCount}/${this.maxRequestsPerHour} requests per hour`);
      return null;
    }

    if (this.openaiDailyCost >= this.maxDailyCost) {
      console.log(`❌ OpenAI cost limit reached: $${this.openaiDailyCost.toFixed(3)}/$${this.maxDailyCost} daily limit`);
      return null;
    }

    try {
      console.log('🤖 Using LLM to extract recipe data...');
      console.log(`📊 Usage: ${this.openaiRequestCount}/${this.maxRequestsPerHour} requests, $${this.openaiDailyCost.toFixed(3)}/$${this.maxDailyCost} cost`);
      
      // Handle empty or minimal HTML
      let contentToAnalyze = '';
      if (!html || html.trim().length === 0) {
        console.log('⚠️ Empty HTML provided, LLM will work with URL only');
        contentToAnalyze = `No HTML content available. URL: ${url}`;
      } else {
        // Clean HTML to reduce token usage
        const $ = cheerio.load(html);
        
        // Remove scripts, styles, nav, footer, ads
        $('script, style, nav, footer, .ad, .advertisement, .sidebar, .related-articles, .comments, .navigation').remove();
        
        // Get clean text content, focusing on main content areas
        const mainContent = $('main, .main-content, .recipe-content, article, .entry-content').text().trim() ||
                           $('body').text().trim();
        
        // Limit content to reduce API costs (roughly 8000 tokens = ~6000 words)
        contentToAnalyze = mainContent.slice(0, 24000);
      }

      const prompt = `
You are a recipe extraction expert. Extract recipe information from the following webpage content.

URL: ${url}

Content:
${contentToAnalyze}

${contentToAnalyze.includes('No HTML content available') ? 
  'Note: The webpage content could not be loaded (possibly due to timeout or JavaScript requirements). Please provide your best guess for a recipe that might be found at this URL, or return an appropriate error response.' : 
  ''}

Please extract and return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2", "..."],
  "instructions": ["step 1", "step 2", "..."],
  "prepTime": "prep time if found",
  "cookTime": "cook time if found", 
  "totalTime": "total time if found",
  "servings": "number of servings if found",
  "image": "image URL if found"
}

Rules:
- Extract ALL ingredients with quantities (e.g., "2 cups flour", "1 lb chicken breast")
- Extract ALL cooking steps in order
- If any field is not found, use an empty string or empty array
- Return ONLY the JSON object, no other text
- Ensure the JSON is valid and properly formatted
`;

      // Use the OpenAI SDK instead of axios
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are a precise recipe extraction assistant. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for consistency
      });

      // Track usage and cost
      this.openaiRequestCount++;
      const usage = response.usage;
      const estimatedCost = (usage.prompt_tokens * 0.00015 + usage.completion_tokens * 0.0006) / 1000; // GPT-4o-mini pricing
      this.openaiDailyCost += estimatedCost;
      
      console.log(`💰 API Call: $${estimatedCost.toFixed(4)} (${usage.prompt_tokens} + ${usage.completion_tokens} tokens)`);
      console.log(`📊 Daily total: $${this.openaiDailyCost.toFixed(4)}/$${this.maxDailyCost}`);

      const llmResponse = response.choices[0].message.content.trim();
      
      // Parse the JSON response
      let recipe;
      try {
        // Remove any markdown code blocks if present
        const jsonString = llmResponse.replace(/```json\s*|\s*```/g, '').trim();
        recipe = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse LLM JSON response:', parseError.message);
        console.log('Raw LLM response:', llmResponse);
        return null;
      }

      // Validate and clean the extracted data
      if (!recipe.title || !recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        console.log('❌ LLM extraction failed: Missing essential recipe data');
        return null;
      }

      // Clean and filter ingredients
      recipe.ingredients = recipe.ingredients
        .filter(ingredient => ingredient && typeof ingredient === 'string' && ingredient.trim().length > 0)
        .map(ingredient => ingredient.trim());

      // Clean and filter instructions
      if (recipe.instructions && Array.isArray(recipe.instructions)) {
        recipe.instructions = recipe.instructions
          .filter(instruction => instruction && typeof instruction === 'string' && instruction.trim().length > 0)
          .map(instruction => instruction.trim());
      } else {
        recipe.instructions = [];
      }

      // Mark as LLM extracted and add token usage info
      recipe.extractionMethod = 'llm';
      recipe.llmUsage = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: estimatedCost,
        model: 'gpt-4o-mini'
      };

      console.log(`🤖 LLM successfully extracted: ${recipe.title}`);
      console.log(`📝 Found ${recipe.ingredients.length} ingredients`);
      console.log(`📋 Found ${recipe.instructions.length} instructions`);

      return recipe;

    } catch (error) {
      console.error('LLM extraction failed:', error.message);
      if (error.status) {
        console.error('OpenAI API Error:', error.status, error.message);
      }
      return null;
    }
  }

  // Extract JSON-LD structured data
  extractJsonLd($) {
    const scripts = $('script[type="application/ld+json"]');
    
    for (let i = 0; i < scripts.length; i++) {
      try {
        const jsonData = JSON.parse($(scripts[i]).html());
        
        // Handle single recipe or array of recipes
        const recipes = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || 
              (item['@graph'] && item['@graph'].some(g => g['@type'] === 'Recipe'))) {
            return this.parseJsonLdRecipe(item);
          }
        }
      } catch (error) {
        console.log('Failed to parse JSON-LD:', error.message);
      }
    }
    return null;
  }

  parseJsonLdRecipe(data) {
    // Handle @graph structure
    if (data['@graph']) {
      const recipe = data['@graph'].find(item => item['@type'] === 'Recipe');
      if (recipe) data = recipe;
    }

    const recipe = {
      title: data.name || '',
      description: data.description || '',
      image: this.extractImage(data.image),
      prepTime: data.prepTime || '',
      cookTime: data.cookTime || '',
      totalTime: data.totalTime || '',
      servings: data.recipeYield || data.yield || '',
      ingredients: this.extractIngredients(data.recipeIngredient || []),
      instructions: this.extractInstructions(data.recipeInstructions || []),
      nutrition: this.extractNutrition(data.nutrition),
      category: data.recipeCategory || '',
      cuisine: data.recipeCuisine || '',
      author: this.extractAuthor(data.author),
      extractionMethod: 'json-ld'
    };

    return recipe;
  }

  extractImage(imageData) {
    if (!imageData) return '';
    if (typeof imageData === 'string') return imageData;
    if (Array.isArray(imageData)) return imageData[0];
    if (imageData.url) return imageData.url;
    return '';
  }

  extractIngredients(ingredients) {
    return ingredients.map(ingredient => {
      if (typeof ingredient === 'string') return ingredient;
      return ingredient.text || ingredient.name || ingredient;
    }).filter(Boolean);
  }

  extractInstructions(instructions) {
    return instructions.map(instruction => {
      if (typeof instruction === 'string') return instruction;
      if (instruction.text) return instruction.text;
      if (instruction.name) return instruction.name;
      return instruction;
    }).filter(Boolean);
  }

  extractNutrition(nutrition) {
    if (!nutrition) return null;
    
    return {
      calories: nutrition.calories || '',
      protein: nutrition.proteinContent || '',
      carbs: nutrition.carbohydrateContent || '',
      fat: nutrition.fatContent || '',
      fiber: nutrition.fiberContent || '',
      sugar: nutrition.sugarContent || '',
      sodium: nutrition.sodiumContent || ''
    };
  }

  extractAuthor(author) {
    if (!author) return '';
    if (typeof author === 'string') return author;
    if (author.name) return author.name;
    return '';
  }

  // Fallback: scrape with CSS selectors
  async scrapeWithSelectors($, url) {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '');
    
    // Updated site-specific selectors (2024/2025)
    const siteSelectors = {
      'allrecipes.com': {
        title: [
          'h1.entry-title',
          'h1.recipe-summary__h1', 
          'h1[data-module="RecipeHeaderTitle"]',
          '.recipe-header h1',
          '.recipe-title',
          'h1'
        ],
        ingredients: [
          '.mntl-structured-ingredients__list-item',
          'span[data-ingredient-name="true"]',
          '[data-ingredient-name]',
          '.recipe-ingred_txt',
          '.ingredients-item-name',
          '.recipe-summary__item',
          '[data-ingredient] span'
        ],
        instructions: [
          '.mntl-sc-block-group--LI .mntl-sc-block-html',
          '.recipe-instructions__list-item p',
          '.instructions-section-item p',
          '.recipe-instruction-text',
          '.instructions-section p',
          '.recipe-instructions p'
        ]
      },
      'food.com': {
        title: ['h1.recipe-title', 'h1'],
        ingredients: ['.recipe-ingredients li', '.ingredient'],
        instructions: ['.recipe-directions li', '.instruction']
      },
      'foodnetwork.com': {
        title: ['h1.o-AssetTitle__a-HeadlineText', 'h1'],
        ingredients: ['.o-RecipeIngredients__a-Ingredient', '.ingredient'],
        instructions: ['.o-Method__m-Step', '.instruction']
      },
      'epicurious.com': {
        title: ['h1[data-testid="recipe-header-title"]', 'h1'],
        ingredients: ['[data-testid="ingredient"] p', '.ingredient'],
        instructions: ['[data-testid="instruction"] p', '.instruction']
      },
      'simplyrecipes.com': {
        title: ['h1.entry-title', 'h1'],
        ingredients: ['.structured-ingredients__list-item', '.ingredient'],
        instructions: ['.structured-project__steps li', '.instruction']
      },
      'tasteofhome.com': {
        title: ['h1.recipe-title', 'h1'],
        ingredients: ['.recipe-ingredients__item', '.ingredient'],
        instructions: ['.recipe-directions__item p', '.instruction']
      },
      'delish.com': {
        title: ['h1.recipe-hed', 'h1'],
        ingredients: ['.ingredient-item', '.ingredient'],
        instructions: ['.direction-lists li', '.instruction']
      },
      'eatingwell.com': {
        title: ['h1.recipe-title', 'h1'],
        ingredients: ['.recipe-ingredients li', '.ingredient'],
        instructions: ['.recipe-instructions li', '.instruction']
      }
    };

    // Get selectors for this site or use generic fallbacks
    const siteConfig = siteSelectors[hostname] || {
      title: ['h1', '.recipe-title', '[itemprop="name"]'],
      ingredients: ['[itemprop="recipeIngredient"]', '.ingredient', '.recipe-ingredient'],
      instructions: ['[itemprop="recipeInstructions"]', '.instruction', '.recipe-instruction']
    };

    // Helper function to try multiple selectors
    const trySelectors = (selectorArray, extractText = true) => {
      // Handle both array and string formats
      const selectors = Array.isArray(selectorArray) ? selectorArray : [selectorArray];
      
      for (const selector of selectors) {
        try {
          const elements = $(selector);
          if (elements.length > 0) {
            if (extractText) {
              const results = elements.map((i, el) => $(el).text().trim()).get().filter(Boolean);
              if (results.length > 0) return results;
            } else {
              const text = elements.first().text().trim();
              if (text) return text;
            }
          }
        } catch (error) {
          console.log(`Selector "${selector}" failed:`, error.message);
        }
      }
      return extractText ? [] : '';
    };

    // Extract data using multiple selector attempts
    const title = trySelectors(siteConfig.title, false);
    const ingredients = trySelectors(siteConfig.ingredients, true);
    const instructions = trySelectors(siteConfig.instructions, true);

    // Additional metadata extraction with fallbacks
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('.recipe-description').text().trim() || '';
    
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  $('.recipe-image img').attr('src') || '';

    // Extract additional recipe metadata with multiple attempts
    const prepTime = $('[itemprop="prepTime"]').attr('datetime') || 
                     $('[itemprop="prepTime"]').text().trim() || 
                     $('.prep-time').text().trim() || '';
    
    const cookTime = $('[itemprop="cookTime"]').attr('datetime') || 
                     $('[itemprop="cookTime"]').text().trim() || 
                     $('.cook-time').text().trim() || '';
    
    const totalTime = $('[itemprop="totalTime"]').attr('datetime') || 
                      $('[itemprop="totalTime"]').text().trim() || 
                      $('.total-time').text().trim() || '';
    
    const servings = $('[itemprop="recipeYield"]').text().trim() || 
                     $('[itemprop="yield"]').text().trim() || 
                     $('.servings').text().trim() || 
                     $('.recipe-yield').text().trim() || '';

    // Enhanced logging for debugging
    console.log(`📊 Scraping results for ${hostname}:`);
    console.log(`   Title: ${title ? '✅' : '❌'} "${title}"`);
    console.log(`   Ingredients: ${ingredients.length > 0 ? '✅' : '❌'} (${ingredients.length} found)`);
    console.log(`   Instructions: ${instructions.length > 0 ? '✅' : '❌'} (${instructions.length} found)`);
    console.log(`   Description: ${description ? '✅' : '❌'} (${description.length} chars)`);
    console.log(`   Image: ${image ? '✅' : '❌'}`);
    console.log(`   Prep Time: ${prepTime ? '✅' : '❌'} "${prepTime}"`);
    console.log(`   Cook Time: ${cookTime ? '✅' : '❌'} "${cookTime}"`);
    console.log(`   Servings: ${servings ? '✅' : '❌'} "${servings}"`);

    return {
      title,
      ingredients,
      instructions,
      description,
      image,
      prepTime,
      cookTime,
      totalTime,
      servings,
      extractionMethod: 'css-selectors'
    };
  }

  async scrapeRecipe(url) {
    try {
      console.log(`🔍 Scraping recipe from: ${url}`);
      
      // First try with axios + cheerio for speed
      let html;
      let puppeteerFailed = false;
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          },
          timeout: 10000
        });
        html = response.data;
      } catch (axiosError) {
        console.log('Axios failed, trying Puppeteer:', axiosError.message);
        
        // Fallback to Puppeteer for JavaScript-heavy sites
        try {
          const browser = await this.initBrowser();
          const page = await browser.newPage();
          
          await page.setUserAgent(this.userAgent);
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
          html = await page.content();
          await page.close();
        } catch (puppeteerError) {
          console.log('Puppeteer also failed (timeout or other error), will try LLM:', puppeteerError.message);
          puppeteerFailed = true;
          
          // If it's a timeout, we'll try to get basic HTML with a simpler approach
          if (puppeteerError.message.includes('timeout') || puppeteerError.message.includes('Navigation timeout')) {
            console.log('🕐 Puppeteer timeout detected, attempting basic HTML fetch for LLM...');
            try {
              // Try a basic fetch with shorter timeout for LLM
              const response = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 5000
              });
              html = response.data;
            } catch (basicFetchError) {
              console.log('Basic HTML fetch also failed, LLM will try with empty HTML');
              html = '';
            }
          }
        }
      }

      // If we have HTML, try traditional scraping first
      let recipe = null;
      if (html && !puppeteerFailed) {
        const $ = cheerio.load(html);
        
        // Try JSON-LD first (most reliable)
        recipe = this.extractJsonLd($);
        
        // Fallback to CSS selectors
        if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
          console.log('JSON-LD failed or incomplete, trying CSS selectors...');
          recipe = await this.scrapeWithSelectors($, url);
        }
      }

      // Final fallback: Use LLM if traditional methods failed OR if Puppeteer timed out
      if (!recipe || !recipe.title || !recipe.ingredients || recipe.ingredients.length === 0 || puppeteerFailed) {
        console.log(puppeteerFailed ? 
          'Puppeteer timed out, using LLM extraction...' : 
          'Traditional scraping failed, trying LLM extraction...');
        recipe = await this.extractRecipeWithLLM(html, url);
      }

      // Validate required fields
      if (!recipe || !recipe.title || !recipe.ingredients || recipe.ingredients.length === 0) {
        throw new Error('Could not extract essential recipe data (title and ingredients required) using any method');
      }

      // Filter out empty ingredients
      recipe.ingredients = recipe.ingredients.filter(ingredient => 
        ingredient && ingredient.trim().length > 0
      );

      // Filter out empty instructions
      if (recipe.instructions) {
        recipe.instructions = recipe.instructions.filter(instruction => 
          instruction && instruction.trim().length > 0
        );
      }

      recipe.sourceUrl = url;
      recipe.scrapedAt = new Date().toISOString();
      
      console.log(`✅ Successfully scraped: ${recipe.title}`);
      console.log(`📝 Found ${recipe.ingredients.length} ingredients`);
      console.log(`📋 Found ${recipe.instructions ? recipe.instructions.length : 0} instructions`);
      console.log(`🔧 Extraction method: ${recipe.extractionMethod || 'unknown'}`);
      
      return recipe;

    } catch (error) {
      console.error('Recipe scraping failed completely:', error.message);
      throw new Error(`Failed to scrape recipe: ${error.message}`);
    }
  }

  // Cleanup method
  async cleanup() {
    await this.closeBrowser();
  }
}

export default RecipeScraper;