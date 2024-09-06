# ScrapeTweet

`ScrapeTweet` is a Node.js script that uses Playwright to scrape tweets from a specific Twitter list. It collects all tweets from the last 24 hours and provides an API to query the mention count of any keyword within that dataset.

- Scrapes tweets from a Twitter list URL.
- Collects tweets from the last 24 hours.
- Provides an API to query any keyword and get the mention count from the scraped tweets.
- Handles scrolling to load more tweets until the specified criteria are met.
- Exports the results to a JSON file and stores them in MongoDB.

## Prerequisites

- Node.js (version 14 or higher)
- Playwright
- Moment.js
- MongoDB
- Node Cron
- Express

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/fuzztobread/scrapetweet.git
   cd scrapetweet
2. **Install Dependencies**:
   ```bash
   npm install
   npx playwright install
3. **Prepare Twitter Cookies**:
   - Ensure you have a twitter_cookies.json file with valid Twitter cookies.
   - You can obtain cookies by inspecting your browser's storage while logged into Twitter and exporting them.
   - You can also use cookie editor extension from google chrome store after authenticating to twitter's site to grab the cookies.
4. **Setup MongoDB**:
   - Setup MongoDB using MongoAtlas
   -Replace the MongoDB connection URI in the script with your own. You can find your connection string in the Atlas dashboard.
   -Example: const uri = "your-mongodb-connection-uri";
4. **Run**:
   ```bash
   node scrape.js 
5. **To run the script periodically in 24 hours, make sure to not close the server**
6. **Run**:
   ```bash
   node index.js
   - from the http://localhost:3000/search/{your keyword}, and check the mention count




