const { chromium } = require('playwright');
const fs = require('fs');
const moment = require('moment');

(async () => {
  // Load cookies from JSON file
  const cookies = JSON.parse(fs.readFileSync('twitter_cookies.json', 'utf8'));


  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();

  
  await page.goto('https://twitter.com/i/lists/1587685082961149953');

 
  await page.waitForSelector('[data-testid="tweet"]');

  let mentionCount = 0;
  const scrollDelay = 3000; // Delay to allow tweets to load
  const startTime = moment().subtract(24, 'hours'); // Set the start time for 24 hours ago
  let previousTweetCount = 0;
  let totalScrolls = 0;
  let consecutiveOldTweets = 0;
  const requiredOldTweets = 3; // Number of tweets beyond 24 hours needed to stop

  
  const tweetIDs = new Set();
  const mentions = [];

  while (consecutiveOldTweets < requiredOldTweets) {
    
    const tweetElements = await page.$$('article[data-testid="tweet"]');
    console.log(`Found ${tweetElements.length} tweets`);

    for (let i = 0; i < tweetElements.length; i++) {
      const tweet = tweetElements[i];
      try {
        const tweetID = await tweet.evaluate(el => el.getAttribute('data-tweet-id'));
        const tweetText = await tweet.evaluate(el => el.textContent);
        const tweetTimeElement = await tweet.$('time');
        const tweetLinkElement = await tweet.$('a[href^="/"]'); // Selector for tweet link
        const isRepost = await tweet.$('[data-testid="socialContext"]');

        if (isRepost) {
          console.log('Skipping reposted tweet');
          continue;
        }

        if (tweetTimeElement) {
          const tweetTime = await tweetTimeElement.getAttribute('datetime');
          console.log(`Tweet time: ${tweetTime}`);
          console.log(`Tweet text: ${tweetText}`);

          // Parse tweet time
          const tweetMoment = moment(tweetTime);

          if (!tweetMoment.isValid()) {
            console.log(`Invalid date format: ${tweetTime}`);
            continue;
          }

          if (tweetMoment.isAfter(startTime)) {
            // Process tweets within 24 hours
            if (tweetText.toLowerCase().includes('$aapl stocks') && !tweetIDs.has(tweetID)) {
              tweetIDs.add(tweetID);
              mentionCount++;
              const tweetLink = tweetLinkElement ? await tweetLinkElement.getAttribute('href') : 'No link';
              mentions.push({
                time: tweetTime,
                text: tweetText,
                link: `https://twitter.com${tweetLink}`
              });
              console.log(`Found mention: ${tweetText}`);
            }
            consecutiveOldTweets = 0; 
          } else {
            consecutiveOldTweets++; 
            console.log(`Found ${consecutiveOldTweets} tweet(s) beyond 24 hours.`);
            if (consecutiveOldTweets >= requiredOldTweets) {
              console.log(`Found ${requiredOldTweets} tweets beyond 24 hours, stopping...`);
              break;
            }
          }
        } else {
          console.log('Time element not found for a tweet.');
        }
      } catch (error) {
        console.log('Error processing a tweet:', error);
      }
    }

    if (consecutiveOldTweets < requiredOldTweets) {
      
      await page.waitForTimeout(scrollDelay);

   
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      totalScrolls++;
      console.log(`Scroll ${totalScrolls}: Scrolled down to load more tweets`);

     
      const newTweetElements = await page.$$('article[data-testid="tweet"]');
      if (newTweetElements.length === previousTweetCount) {
        console.log('No new tweets found after scrolling, checking if we reached the end of the page...');
        const endOfPage = await page.evaluate(() => {
          return document.documentElement.scrollHeight === window.innerHeight + window.scrollY;
        });

        if (endOfPage) {
          console.log('Reached the end of the page.');
          break;
        } else {
          console.log('New tweets are expected to be loaded in the next scroll.');
        }
      }
      previousTweetCount = newTweetElements.length;
    }
  }

  console.log(`The keyword "$AAPL stocks" was mentioned ${mentionCount} times in the last 24 hours.`);
  console.log('Mentions found:', mentions);

  // Store results in a JSON file
  const results = {
    keyword: "$AAPL Stocks",
    mentionCount: mentionCount,
    mentions: mentions,
    scrapedAt: new Date().toISOString()
  };

  fs.writeFileSync('twitter_mentions.json', JSON.stringify(results, null, 2));
  console.log('Results have been stored in twitter_mentions.json');

  
  await browser.close();
})();
