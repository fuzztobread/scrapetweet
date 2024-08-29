const { chromium } = require('playwright');
const fs = require('fs');
const moment = require('moment');

(async () => {
  const cookies = JSON.parse(fs.readFileSync('twitter_cookies.json', 'utf8'));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();

  await page.goto('https://twitter.com/i/lists/1587685082961149953');

  await page.waitForSelector('[data-testid="tweet"]');

  let mentionCount = 0;
  const scrollDelay = 3000; 
  const startTime = moment().subtract(24, 'hours'); 
  let previousTweetCount = 0;
  let totalScrolls = 0;
  let consecutiveOldTweets = 0;
  const requiredOldTweets = 3; 

  const tweetIdentifiers = new Set();
  const mentions = [];

  while (consecutiveOldTweets < requiredOldTweets) {
    const tweetElements = await page.$$('article[data-testid="tweet"]');
    console.log(`Found ${tweetElements.length} tweets`);

    for (let i = 0; i < tweetElements.length; i++) {
      const tweet = tweetElements[i];
      try {
        const tweetID = await tweet.evaluate(el => el.getAttribute('data-tweet-id')) || `${await tweet.innerText()}-${await tweet.$eval('time', el => el.getAttribute('datetime'))}`;
        const tweetText = await tweet.innerText();
        const tweetTimeElement = await tweet.$('time');
        const tweetLinkElement = await tweet.$('a[href^="/"]'); 
        const isRepost = await tweet.$('[data-testid="socialContext"]');

        if (isRepost) {
          console.log('Skipping reposted tweet');
          continue;
        }

        if (tweetTimeElement) {
          const tweetTime = await tweetTimeElement.getAttribute('datetime');
          console.log(`Tweet time: ${tweetTime}`);
          console.log(`Tweet text: ${tweetText}`);

          const tweetMoment = moment(tweetTime);

          if (!tweetMoment.isValid()) {
            console.log(`Invalid date format: ${tweetTime}`);
            continue;
          }

          if (tweetMoment.isAfter(startTime)) {
            if (tweetText.toLowerCase().includes('$aapl') && !tweetIdentifiers.has(tweetID)) {
              tweetIdentifiers.add(tweetID);
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

  console.log(`The keyword "$aapl" was mentioned ${mentionCount} times in the last 24 hours.`);
  console.log('Mentions found:', mentions);

  // Export the mentions to a JSON file
  fs.writeFileSync('mentions.json', JSON.stringify(mentions, null, 2), 'utf8');
  console.log('Mentions saved to mentions.json');

  await browser.close();
})();
