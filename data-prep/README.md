# Data Preparation Scripts

This directory contains scripts for scraping and processing data to train persona models for Hitesh Choudhary and Piyush Garg.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (for Twitter API - optional):
```bash
cp .env.example .env
# Edit .env with your Twitter API credentials
```

## Usage

### 1. Scrape Raw Data
```bash
npm run scrape
```
This will:
- Attempt to scrape YouTube transcripts
- Collect sample Twitter-like content
- Save raw data to `./scraped-data/`

### 2. Process Data
```bash
npm run process
```
This will:
- Clean and normalize the raw data
- Extract persona-specific features
- Generate training prompts
- Save processed data to `./processed-data/`

## Manual Data Collection

Since automated scraping might face limitations:

1. **YouTube**: Manually download transcripts using YouTube's auto-generated captions
2. **Twitter**: Use Twitter's advanced search to find relevant tweets
3. **Blog Posts**: Copy content from their personal websites and technical blogs

## Data Structure

### Raw Data Format
```json
{
  "videoId": "string",
  "content": "string",
  "type": "youtube|twitter|blog",
  "timestamp": "ISO string"
}
```

### Processed Features
```json
{
  "commonPhrases": ["array of characteristic phrases"],
  "technicalTerms": ["array of technical vocabulary"],
  "teachingPatterns": ["array of teaching approaches"],
  "humor": ["array of humor examples"],
  "greetings": ["array of greeting styles"]
}
```

## Notes

- YouTube transcript scraping requires video IDs to be publicly available with captions
- Twitter scraping requires API access (use sample data for development)
- Manual curation often produces better quality training data than automated scraping