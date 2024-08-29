const { chromium } = require('playwright');
const fs = require('fs');
const moment = require('moment');

(async () => {
  // Load cookies from JSON file
  const cookies = JSON.parse(fs.readFileSync('twitter_cookies.json', 'utf8'));

  // Launch browser and set up context
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();

  // Navigate to Twitter list (replace with your list URL)
  await page.goto('https://twitter.com/i/lists/1587685082961149953');
  await page.waitForSelector('[data-testid="tweet"]');

  let mentionCount = 0;
  const scrollDelay = 2000; // Adjusted delay to speed up the process
  const startTime = moment().subtract(24, 'hours');
  let previousTweetCount = 0;
  let totalScrolls = 0;
  let consecutiveOldTweets = 0;
  const requiredOldTweets = 3;

  // Use a Set to track unique tweet IDs
  const tweetIDs = new Set();
  const mentions = [];

  while (consecutiveOldTweets < requiredOldTweets) {
    // Scrape tweets
    const tweetElements = await page.$$('article[data-testid="tweet"]');

    if (tweetElements.length === 0) {
      console.log('No tweets found, checking if we reached the end of the page...');
      const endOfPage = await page.evaluate(() => document.documentElement.scrollHeight === window.innerHeight + window.scrollY);
      if (endOfPage) {
        console.log('Reached the end of the page.');
        break;
      }
    }

    // Process tweets in parallel
    await Promise.all(tweetElements.map(async tweet => {
      try {
        const tweetID = await tweet.evaluate(el => el.getAttribute('data-tweet-id'));
        const tweetText = await tweet.innerText();
        const tweetTimeElement = await tweet.$('time');
        const tweetLinkElement = await tweet.$('a[href^="/"]');
        const isRepost = await tweet.$('[data-testid="socialContext"]');

        if (isRepost) return;

        if (tweetTimeElement) {
          const tweetTime = await tweetTimeElement.getAttribute('datetime');
          const tweetMoment = moment(tweetTime);

          if (!tweetMoment.isValid()) return;

          if (tweetMoment.isAfter(startTime)) {
            if (tweetText.toLowerCase().includes('$aapl stocks') && !tweetIDs.has(tweetID)) {
              tweetIDs.add(tweetID);
              mentionCount++;
              const tweetLink = tweetLinkElement ? await tweetLinkElement.getAttribute('href') : 'No link';
              mentions.push({
                time: tweetTime,
                text: tweetText,
                link: `https://twitter.com${tweetLink}`
              });
            }
            consecutiveOldTweets = 0;
          } else {
            consecutiveOldTweets++;
            if (consecutiveOldTweets >= requiredOldTweets) return;
          }
        }
      } catch (error) {
        console.log('Error processing a tweet:', error);
      }
    }));

    if (consecutiveOldTweets < requiredOldTweets) {
      await page.waitForTimeout(scrollDelay);

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      totalScrolls++;
      console.log(`Scroll ${totalScrolls}: Scrolled down to load more tweets`);

      // Check if new tweets were loaded
      const newTweetElements = await page.$$('article[data-testid="tweet"]');
      if (newTweetElements.length === previousTweetCount) {
        const endOfPage = await page.evaluate(() => document.documentElement.scrollHeight === window.innerHeight + window.scrollY);
        if (endOfPage) {
          console.log('Reached the end of the page.');
          break;
        }
      }
      previousTweetCount = newTweetElements.length;
    }
  }

  console.log(`The keyword "$aapl stocks" was mentioned ${mentionCount} times in the last 24 hours.`);
  console.log('Mentions found:', mentions);

  const exportData = {
    mentionCount: mentionCount,
    mentions: mentions,
    scrapedAt: new Date().toISOString()
  };

  fs.writeFileSync('twitter_mentions_export.json', JSON.stringify(exportData, null, 2));
  console.log('Data exported to twitter_mentions_export.json');

  await browser.close();
})();

