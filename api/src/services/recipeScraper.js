const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');
const OpenAI = require('openai').default;

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
        // Clean up HTML and truncate if too long (GPT-4 has context limits)
        const $ = cheerio.load(html);
        
        // Remove script and style tags
        $('script, style, meta, link').remove();
        
        // Get text content and limit size
        let textContent = $.text().replace(/\s+/g, ' ').trim();
        const maxLength = 8000; // Conservative limit for GPT-4
        
        if (textContent.length > maxLength) {
          textContent = textContent.substring(0, maxLength) + '...';
          console.log(`📝 Truncated content to ${maxLength} characters for LLM processing`);
        }
        
        contentToAnalyze = `URL: ${url}\nContent: ${textContent}`;
      }

      const prompt = `Extract recipe data from the following webpage content. Return ONLY a JSON object with these exact fields:

{
  "title": "Recipe title",
  "ingredients": ["ingredient 1", "ingredient 2", "..."],
  "instructions": ["step 1", "step 2", "..."],
  "prepTime": "preparation time",
  "cookTime": "cooking time",
  "servings": "number of servings",
  "description": "brief description"
}

If any field cannot be determined, use null. Do not include any explanation, just the JSON object.

Content to analyze:
${contentToAnalyze}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.1
      });

      // Calculate and track costs
      const usage = response.usage;
      const inputCost = (usage.prompt_tokens / 1000000) * 0.15; // $0.15 per 1M input tokens
      const outputCost = (usage.completion_tokens / 1000000) * 0.60; // $0.60 per 1M output tokens
      const totalCost = inputCost + outputCost;
      
      this.openaiRequestCount++;
      this.openaiDailyCost += totalCost;

      console.log(`💰 OpenAI API Cost: $${totalCost.toFixed(4)} (Input: $${inputCost.toFixed(4)}, Output: $${outputCost.toFixed(4)})`);
      console.log(`📊 Total today: ${this.openaiRequestCount}/${this.maxRequestsPerHour} requests, $${this.openaiDailyCost.toFixed(3)}/$${this.maxDailyCost}`);
      console.log(`🔤 Tokens used: ${usage.prompt_tokens} input + ${usage.completion_tokens} output = ${usage.total_tokens} total`);

      const content = response.choices[0]?.message?.content?.trim();
      
      if (!content) {
        console.log('❌ No content in LLM response');
        return null;
      }

      try {
        // Clean up the response to extract JSON
        let jsonStr = content;
        
        // Remove markdown code blocks if present
        if (jsonStr.includes('```')) {
          const match = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (match) {
            jsonStr = match[1];
          }
        }
        
        const recipeData = JSON.parse(jsonStr);
        
        // Validate the response structure
        if (typeof recipeData !== 'object' || !recipeData.title) {
          console.log('❌ Invalid recipe data structure from LLM');
          return null;
        }

        console.log('✅ Successfully extracted recipe with LLM');
        
        // Return in the expected format with extraction metadata
        return {
          title: recipeData.title || null,
          ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
          instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
          prepTime: recipeData.prepTime || null,
          cookTime: recipeData.cookTime || null,
          servings: recipeData.servings || null,
          description: recipeData.description || null,
          extractionMethod: 'llm-fallback',
          llmUsage: {
            requestCount: this.openaiRequestCount,
            dailyCost: this.openaiDailyCost,
            maxRequests: this.maxRequestsPerHour,
            maxDailyCost: this.maxDailyCost,
            tokensUsed: usage.total_tokens,
            costThisRequest: totalCost
          }
        };
        
      } catch (parseError) {
        console.log('❌ Failed to parse LLM response as JSON:', parseError.message);
        console.log('📝 LLM Response:', content);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error in LLM extraction:', error.message);
      
      // Check if it's a rate limit error
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.log('🚫 OpenAI rate limit reached, marking as exhausted');
        this.openaiRequestCount = this.maxRequestsPerHour; // Mark as exhausted
      }
      
      return null;
    }
  }

  // Enhanced CSS selectors for recipe extraction
  getRecipeSelectors() {
    return {
      title: [
        'h1[class*="recipe-title"]',
        'h1[class*="entry-title"]', 
        'h1[class*="post-title"]',
        '.recipe-summary__h1',
        '.entry-title-primary',
        '.recipe-header h1',
        '.recipe-title',
        '.post-title',
        '.entry-title',
        'h1.title',
        'h1',
        '[data-test-id="recipe-title"]',
        '.recipe-summary .recipe-summary__h1'
      ],
      ingredients: [
        '.recipe-card-ingredient',
        '.recipe-ingredient',
        '.ingredients li',
        '.ingredient-list li',
        '.recipe-ingredients li',
        '.ingredients-section li',
        '.recipe-card-ingredients li',
        '.ingredient',
        '.recipe-nutrition-section .recipe-ingredient',
        '.structured-ingredients__list-item',
        '.recipe-summary__item',
        '[data-test-id="ingredients-prep"] li',
        '.ingredients-list li',
        '.recipe-card-ingredient-list li'
      ],
      instructions: [
        '.recipe-instruction',
        '.instructions li',
        '.recipe-instructions li', 
        '.directions li',
        '.recipe-directions li',
        '.instructions-section li',
        '.recipe-card-instructions li',
        '.direction',
        '.recipe-instruction-text',
        '.mntl-sc-block-group--LI .mntl-sc-block-callout',
        '.instructions-section .paragraph',
        '.recipe-summary__item',
        '[data-test-id="instructions-prep"] li',
        '.instructions-list li',
        '.recipe-card-instruction-list li'
      ],
      prepTime: [
        '.recipe-prep-time',
        '.prep-time',
        '.recipe-summary__prep-time',
        '.recipe-time .prep',
        '.recipe-meta .prep-time',
        '[data-test-id="prep-time"]',
        '.recipe-details .prep-time'
      ],
      cookTime: [
        '.recipe-cook-time',
        '.cook-time', 
        '.recipe-summary__cook-time',
        '.recipe-time .cook',
        '.recipe-meta .cook-time',
        '[data-test-id="cook-time"]',
        '.recipe-details .cook-time'
      ],
      servings: [
        '.recipe-servings',
        '.servings',
        '.recipe-summary__servings', 
        '.recipe-yield',
        '.yield',
        '.recipe-meta .servings',
        '[data-test-id="servings"]',
        '.recipe-details .servings'
      ]
    };
  }

  // Extract recipe data using multiple fallback strategies
  async extractRecipeData(url) {
    console.log(`🔍 Extracting recipe from: ${url}`);
    
    try {
      // Strategy 1: Try simple HTTP request first (faster)
      const simpleData = await this.extractWithSimpleRequest(url);
      if (simpleData && simpleData.title && simpleData.ingredients.length > 0) {
        console.log('✅ Successfully extracted with simple HTTP request');
        return simpleData;
      }

      // Strategy 2: Try Puppeteer with timeout for dynamic content
      console.log('🎭 Trying Puppeteer extraction...');
      const puppeteerData = await this.extractWithPuppeteer(url);
      if (puppeteerData && puppeteerData.title && puppeteerData.ingredients.length > 0) {
        console.log('✅ Successfully extracted with Puppeteer');
        return puppeteerData;
      }

      // Strategy 3: Use LLM as fallback if both fail
      console.log('🤖 Trying LLM extraction as fallback...');
      
      // Get the HTML content for LLM analysis (try both methods)
      let htmlContent = '';
      if (simpleData && simpleData.rawHtml) {
        htmlContent = simpleData.rawHtml;
      } else if (puppeteerData && puppeteerData.rawHtml) {
        htmlContent = puppeteerData.rawHtml;
      } else {
        // Last resort: fetch HTML for LLM
        try {
          const response = await axios.get(url, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 10000
          });
          htmlContent = response.data;
        } catch (error) {
          console.log('⚠️ Could not fetch HTML for LLM analysis');
        }
      }

      const llmData = await this.extractRecipeWithLLM(htmlContent, url);
      if (llmData && llmData.title) {
        console.log('✅ Successfully extracted with LLM fallback');
        return llmData;
      }

      console.log('❌ All extraction methods failed');
      return {
        title: null,
        ingredients: [],
        instructions: [],
        prepTime: null,
        cookTime: null,  
        servings: null,
        description: null,
        extractionMethod: 'failed',
        error: 'Could not extract recipe data using any method'
      };

    } catch (error) {
      console.error('❌ Error in recipe extraction:', error);
      return {
        title: null,
        ingredients: [],
        instructions: [],
        prepTime: null,
        cookTime: null,
        servings: null, 
        description: null,
        extractionMethod: 'error',
        error: error.message
      };
    }
  }

  // Extract using simple HTTP request
  async extractWithSimpleRequest(url) {
    try {
      console.log('📡 Fetching with simple HTTP request...');
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      return {
        ...this.parseRecipeFromHtml($, url),
        extractionMethod: 'simple-request',
        rawHtml: html
      };

    } catch (error) {
      console.log('❌ Simple request failed:', error.message);
      return null;
    }
  }

  // Extract using Puppeteer for dynamic content
  async extractWithPuppeteer(url) {
    let page = null;
    
    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set a timeout for navigation
      const timeoutMs = parseInt(process.env.SCRAPING_TIMEOUT) || 30000;
      
      console.log(`🎭 Loading page with Puppeteer (timeout: ${timeoutMs}ms)...`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: timeoutMs
      });

      // Wait for potential recipe content to load
      await page.waitForTimeout(2000);

      const html = await page.content();
      const $ = cheerio.load(html);

      return {
        ...this.parseRecipeFromHtml($, url),
        extractionMethod: 'puppeteer',
        rawHtml: html
      };

    } catch (error) {
      console.log('❌ Puppeteer extraction failed:', error.message);
      
      // If it's a timeout, we should try LLM fallback
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        console.log('⏰ Puppeteer timed out, will try LLM fallback...');
        
        // Try to get whatever content we can
        try {
          if (page) {
            const partialHtml = await page.content();
            return {
              title: null,
              ingredients: [],
              instructions: [],
              prepTime: null,
              cookTime: null,
              servings: null,
              description: null,
              extractionMethod: 'puppeteer-timeout',
              rawHtml: partialHtml,
              error: 'Puppeteer timeout, attempting LLM fallback'
            };
          }
        } catch (innerError) {
          console.log('❌ Could not get partial content from Puppeteer');
        }
      }
      
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  // Parse recipe data from HTML using cheerio
  parseRecipeFromHtml($, url) {
    const selectors = this.getRecipeSelectors();
    
    // Extract title
    let title = null;
    for (const selector of selectors.title) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        title = element.text().trim();
        break;
      }
    }

    // Extract ingredients
    let ingredients = [];
    for (const selector of selectors.ingredients) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 3) { // Filter out very short items
            ingredients.push(text);
          }
        });
        if (ingredients.length > 0) break;
      }
    }

    // Extract instructions  
    let instructions = [];
    for (const selector of selectors.instructions) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 10) { // Filter out very short items
            instructions.push(text);
          }
        });
        if (instructions.length > 0) break;
      }
    }

    // Extract metadata
    let prepTime = null;
    for (const selector of selectors.prepTime) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        prepTime = element.text().trim();
        break;
      }
    }

    let cookTime = null;
    for (const selector of selectors.cookTime) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        cookTime = element.text().trim();
        break;
      }
    }

    let servings = null;
    for (const selector of selectors.servings) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        servings = element.text().trim();
        break;
      }
    }

    // Try to extract description from meta tags or first paragraph
    let description = null;
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.trim()) {
      description = metaDesc.trim();
    } else {
      const firstP = $('p').first().text().trim();
      if (firstP && firstP.length > 20) {
        description = firstP.substring(0, 200) + (firstP.length > 200 ? '...' : '');
      }
    }

    return {
      title,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      description
    };
  }

  // Get current LLM usage statistics
  getLLMUsage() {
    return {
      requestCount: this.openaiRequestCount,
      dailyCost: this.openaiDailyCost,
      maxRequests: this.maxRequestsPerHour,
      maxDailyCost: this.maxDailyCost,
      hasApiKey: !!this.openaiApiKey,
      isConfigured: !!this.openai
    };
  }

  // Reset usage counters (for testing)
  resetUsageCounters() {
    this.openaiRequestCount = 0;
    this.openaiDailyCost = 0;
    this.lastResetTime = new Date();
  }
}

module.exports = RecipeScraper;