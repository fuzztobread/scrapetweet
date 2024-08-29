# ScrapeTweet

`ScrapeTweet` is a Node.js script that uses Playwright to scrape tweets from a specific Twitter list. It extracts tweets containing the keyword "$aapl stocks" from the last 24 hours and stores relevant information in a JSON file.

## Features

- Scrapes tweets from a Twitter list URL.
- Filters tweets containing the keyword "$aapl stocks".
- Excludes reposted tweets and counts unique mentions.
- Handles scrolling to load more tweets until the specified criteria are met.
- Exports the results to a JSON file.

## Prerequisites

- Node.js (version 14 or higher)
- Playwright
- Moment.js

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
   - Ensure you have a twitter_cookies.json file with valid Twitter cookies. This file should be placed in the same directory as the script.
   - You can obtain cookies by inspecting your browser's storage while logged into Twitter and exporting them.
4. **Run**:
   ```bash
   node scrape.js
5. **Check the results in twitter_mentions_export.json**
6.  **To run the script every 24 hour, we can use utilize the crontab in the OS**
   - Setup cronjob:
   - In your terminal, run crontab -e
   - Syntax for crontab is 0 15 * * * /path/to/your/scrape.js
   - Verify the crontab with crontab -l
   - Save and exit the process

