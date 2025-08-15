const fs = require('fs-extra');

class DataProcessor {
  constructor() {
    this.dataDir = './scraped-data';
    this.outputDir = './processed-data';
  }

  async init() {
    
    await fs.ensureDir(this.outputDir);
  }

  async loadRawData() {
    const hiteshRaw = await fs.readJSON(`${this.dataDir}/hitesh-raw.json`);
    const piyushRaw = await fs.readJSON(`${this.dataDir}/piyush-raw.json`);
    
    return { hiteshRaw, piyushRaw };
  }

  cleanText(text) {
    return text
      .replace(/\[Music\]/g, '')
      .replace(/\[Applause\]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?'"()-]/g, '')
      .trim();
  }

  extractPersonaFeatures(data, personaName) {
    const features = {
      commonPhrases: [],
      technicalTerms: [],
      teachingPatterns: [],
      humor: [],
      greetings: []
    };

    data.forEach(item => {
      const content = this.cleanText(item.content);
      
      // Extract based on persona
      if (personaName === 'hitesh') {
        // Hitesh-specific patterns
        if (content.includes('chai') || content.includes('Haanji')) {
          features.commonPhrases.push(content);
        }
        if (content.match(/(\bhindi\b|\bhinglish\b)/i)) {
          features.teachingPatterns.push(content);
        }
      } else if (personaName === 'piyush') {
        // Piyush-specific patterns
        if (content.includes('clean code') || content.includes('design pattern')) {
          features.technicalTerms.push(content);
        }
        if (content.match(/\b(fast-paced|project-based|hands-on)\b/i)) {
          features.teachingPatterns.push(content);
        }
      }
    });

    return features;
  }

  generateTrainingPrompts(data, personaName) {
    const prompts = [];
    
    data.forEach(item => {
      const content = this.cleanText(item.content);
      
      if (content.length > 50 && content.length < 500) {
        prompts.push({
          input: `Explain this concept: ${this.extractConcept(content)}`,
          output: content,
          persona: personaName,
          source: item.type || 'unknown'
        });
      }
    });

    return prompts;
  }

  extractConcept(text) {
    const techWords = ['javascript', 'react', 'node', 'api', 'database', 'frontend', 'backend', 'docker', 'aws'];
    const words = text.toLowerCase().split(' ');
    
    for (const word of words) {
      if (techWords.some(tech => word.includes(tech))) {
        return word;
      }
    }
    
    return 'programming concept';
  }

  async processData() {
    console.log('🔄 Processing raw data...');
    
    const { hiteshRaw, piyushRaw } = await this.loadRawData();
    
    // Extract persona features
    const hiteshFeatures = this.extractPersonaFeatures(hiteshRaw, 'hitesh');
    const piyushFeatures = this.extractPersonaFeatures(piyushRaw, 'piyush');
    
    // Generate training prompts
    const hiteshPrompts = this.generateTrainingPrompts(hiteshRaw, 'hitesh');
    const piyushPrompts = this.generateTrainingPrompts(piyushRaw, 'piyush');
    
    // Save processed data
    await fs.writeJSON(`${this.outputDir}/hitesh-features.json`, hiteshFeatures, { spaces: 2 });
    await fs.writeJSON(`${this.outputDir}/piyush-features.json`, piyushFeatures, { spaces: 2 });
    await fs.writeJSON(`${this.outputDir}/hitesh-prompts.json`, hiteshPrompts, { spaces: 2 });
    await fs.writeJSON(`${this.outputDir}/piyush-prompts.json`, piyushPrompts, { spaces: 2 });
    
    console.log('✅ Data processing completed!');
    console.log(`📊 Generated ${hiteshPrompts.length} Hitesh training prompts`);
    console.log(`📊 Generated ${piyushPrompts.length} Piyush training prompts`);
    
    return {
      hiteshFeatures,
      piyushFeatures,
      hiteshPrompts,
      piyushPrompts
    };
  }

  async run() {
    await this.init();
    const processedData = await this.processData();
    
    console.log('🎉 Data processing pipeline completed!');
    console.log('Processed data saved in ./processed-data/');
    
    return processedData;
  }
}

if (require.main === module) {
  const processor = new DataProcessor();
  processor.run().catch(console.error);
}

module.exports = DataProcessor;