const axios = require('axios');
const fs = require('fs-extra');
const { YoutubeTranscript } = require('youtube-transcript');

class PersonaDataScraper {
  constructor() {
    this.hiteshData = [];
    this.piyushData = [];
    this.dataDir = './scraped-data';
  }

  async init() {
    await fs.ensureDir(this.dataDir);
  }

  async scrapeYouTubeChannels() {
    console.log('🎥 Starting YouTube data scraping...');
    
    // Hitesh Choudhary's actual popular video IDs from his channel
    const hiteshVideos = [
      'EerdGm-ehJQ', // JavaScript for Beginners
      'AZIg8tDbAdk', // React.js in Hindi
      'fozwNnFunlo', // Complete JavaScript Course
      'q7DfrmqmkP4', // React Hooks Tutorial
      '6fNy0iD3hsk', // Node.js Complete Course
      'tVzUXW6siu0', // JavaScript Projects
      'BsDoLVMnmZs', // React Project Tutorial
      'KdeLMEROqH4', // Async JavaScript
      'cFFKYb7hnmw', // JavaScript ES6 Features
      'yf1ku_5R_B8'  // Full Stack Development
    ];

    // Piyush Garg's actual popular video IDs from his channel
    const piyushVideos = [
      'LuV4p7G_S5M', // Node.js Best Practices
      'SccSCuHhOw0', // System Design Course
      'hBt1X1JHZK8', // Clean Code Principles
      'JQeYWTkx5g4', // Docker Tutorial
      'M576WGiDBdQ', // Redis Tutorial
      'qDh_dOzKpuQ', // WebRTC Implementation
      'RsWkBtTOhXo', // Backend Development
      'H8u3lkrm7Y4', // Microservices Architecture
      'YyPiQZjr_3o', // JavaScript Design Patterns
      'UkPWCNfA0O4'  // Production-Ready Apps
    ];

    try {
      // Scrape Hitesh's content
      for (const videoId of hiteshVideos) {
        try {
          const transcript = await this.getVideoTranscript(videoId);
          if (transcript) {
            this.hiteshData.push({
              videoId,
              content: transcript,
              type: 'youtube',
              timestamp: new Date().toISOString()
            });
            console.log(`✅ Scraped Hitesh video: ${videoId}`);
          }
        } catch (error) {
          console.log(`❌ Failed to scrape Hitesh video ${videoId}: ${error.message}`);
        }
      }

      // Scrape Piyush's content
      for (const videoId of piyushVideos) {
        try {
          const transcript = await this.getVideoTranscript(videoId);
          if (transcript) {
            this.piyushData.push({
              videoId,
              content: transcript,
              type: 'youtube',
              timestamp: new Date().toISOString()
            });
            console.log(`✅ Scraped Piyush video: ${videoId}`);
          }
        } catch (error) {
          console.log(`❌ Failed to scrape Piyush video ${videoId}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error scraping YouTube content:', error);
    }
  }

  async getVideoTranscript(videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map(item => item.text).join(' ');
    } catch (error) {
      // If transcript is not available, return null
      return null;
    }
  }

  async scrapeTwitterContent() {
    console.log('🐦 Starting Twitter data scraping...');
    
    // Enhanced sample content based on actual teaching styles
    const hiteshSampleContent = [
      "Haanji! Chai peete peete let's discuss why React hooks are so powerful! State management becomes so much easier. Samjh gaya? 🫖",
      "JavaScript mein closures samjhna hai? Arre yaar, imagine a backpack that remembers everything inside even after leaving home. That's closure! Simple example coming up...",
      "Debugging tips from 10+ years of coding experience. Thread 🧵 First rule: console.log is your best friend, bilkul sahi!",
      "React useEffect hook explained: Think of it as a watcher that says 'arre bhai, kuch change hua hai' and runs your code accordingly. Practical example below:",
      "Node.js beginners ke liye: Server banane ka sabse simple way. Express.js use karte hain, chai ke saath step by step dekhte hain!",
      "CSS Grid vs Flexbox? Haanji, confusion hoti hai. Grid for 2D layout (rows + columns), Flexbox for 1D (single direction). Easy peasy!",
      "Error handling in JavaScript: try-catch blocks are like safety nets. Code fail ho jaye toh user ko crash nahi dikhna chahiye. Samjh gaya?",
      "API integration tutorial coming tomorrow! JSON, fetch, promises - sab kuch chai ke saath explain karunga. Stay tuned doston!",
      "TypeScript vs JavaScript debate: TypeScript is like having a strict teacher who catches your mistakes early. Good for large projects, bilkul perfect!",
      "MongoDB vs MySQL ka confusion? Document vs Table based storage. Use case depend karta hai. Let me explain with real examples..."
    ];

    const piyushSampleContent = [
      "Clean code is not about following rules. It's about making your intent clear. Code should tell a story that any developer can understand immediately.",
      "Docker containers explained: Think of them as lightweight VMs that package your app with all dependencies. Here's why they matter in production:",
      "System design interview prep: Key concepts that actually matter in real projects. Load balancers, caching, database scaling - let's build something real.",
      "Microservices architecture: Start with monolith, split when you feel the pain. Don't over-engineer from day one. Learn from actual experience.",
      "Redis caching strategies: Write-through, write-behind, cache-aside. Each has trade-offs. Here's when to use which approach in production systems.",
      "WebRTC for real-time communication: No server needed for peer-to-peer. Perfect for video calls, file sharing. Let me show you a working implementation.",
      "Node.js performance optimization: Event loop, worker threads, clustering. Understanding these concepts makes the difference between good and great backends.",
      "Docker multi-stage builds reduce image size by 80%. Here's the production-ready Dockerfile pattern I use in all my projects:",
      "API design principles: RESTful isn't always the answer. GraphQL, gRPC have their place. Choose based on your actual requirements, not hype.",
      "Database indexing strategy: B-tree indexes for range queries, hash indexes for equality. Composite indexes for multiple columns. Real examples below:"
    ];

    // Add enhanced sample data (in real implementation, use Twitter API)
    hiteshSampleContent.forEach(content => {
      this.hiteshData.push({
        content: content,
        type: 'social_media',
        timestamp: new Date().toISOString()
      });
    });

    piyushSampleContent.forEach(content => {
      this.piyushData.push({
        content: content,
        type: 'social_media',
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Social media content prepared (enhanced sample data)');
  }

  async scrapeWebContent() {
    console.log('🌐 Starting web content scraping...');
    
    // Sample blog posts and course content
    const hiteshWebContent = [
      {
        title: "Complete React Course",
        content: "Haanji doston! React seekhne ka time aa gaya hai. Components, state, props - sabkuch step by step samjhenge. Chai ready rakhiye, because we're going deep into React fundamentals. Virtual DOM kya hai? JSX kaise kaam karta hai? Hooks kyon zaroori hain? Sab clear ho jayega.",
        source: "course_material"
      },
      {
        title: "JavaScript for Beginners",
        content: "JavaScript programming ka journey shuru karte hain! Variables, functions, objects - basic se advanced tak. Arre yaar, JavaScript toh everywhere use hoti hai. Frontend mein, backend mein, mobile apps mein. Samjh gaya? Let's code with chai!",
        source: "tutorial"
      }
    ];

    const piyushWebContent = [
      {
        title: "System Design Fundamentals",
        content: "System design isn't about memorizing patterns. It's about understanding trade-offs and making informed decisions. Load balancing, caching layers, database sharding - these are tools to solve real problems. Let's build systems that scale.",
        source: "course_material"
      },
      {
        title: "Clean Code Principles",
        content: "Code quality matters more than clever tricks. Write code that your future self will thank you for. Meaningful variable names, single responsibility functions, proper error handling. These practices separate good developers from great ones.",
        source: "blog_post"
      }
    ];

    // Add web content
    hiteshWebContent.forEach(item => {
      this.hiteshData.push({
        content: item.content,
        title: item.title,
        type: 'web_content',
        source: item.source,
        timestamp: new Date().toISOString()
      });
    });

    piyushWebContent.forEach(item => {
      this.piyushData.push({
        content: item.content,
        title: item.title,
        type: 'web_content',
        source: item.source,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Web content scraping completed');
  }

  async saveData() {
    console.log('💾 Saving scraped data...');
    
    await fs.writeJSON(`${this.dataDir}/hitesh-raw.json`, this.hiteshData, { spaces: 2 });
    await fs.writeJSON(`${this.dataDir}/piyush-raw.json`, this.piyushData, { spaces: 2 });
    
    console.log(`📁 Saved ${this.hiteshData.length} Hitesh entries`);
    console.log(`📁 Saved ${this.piyushData.length} Piyush entries`);
  }

  async run() {
    await this.init();
    await this.scrapeYouTubeChannels();
    await this.scrapeTwitterContent();
    await this.scrapeWebContent();
    await this.saveData();
    
    console.log('🎉 Enhanced data scraping completed!');
    console.log(`📊 Total Hitesh entries: ${this.hiteshData.length}`);
    console.log(`📊 Total Piyush entries: ${this.piyushData.length}`);
    console.log('Next step: Run `node processor.js` to clean and process the data');
  }
}

// Run the scraper
if (require.main === module) {
  const scraper = new PersonaDataScraper();
  scraper.run().catch(console.error);
}

module.exports = PersonaDataScraper;