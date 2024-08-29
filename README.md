# ScraperTweet

`ScrapeTweet` is a Node.js script that uses Playwright to scrape tweets from a specific Twitter list. It extracts tweets containing the keyword "engineers" from the last 24 hours and stores relevant information in a JSON file.

## Features

- Scrapes tweets from a Twitter list URL.
- Filters tweets containing the keyword "engineers".
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
3. **Prepare Twitter Cookies**:
   - Ensure you have a twitter_cookies.json file with valid Twitter cookies. This file should be placed in the same directory as the script.
   - You can obtain cookies by inspecting your browser's storage while logged into Twitter and exporting them.
4. **Run**:
   ```bash
   node scrape.js
5. **Check the results in twitter_mentions_export.json** 

