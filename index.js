const express = require('express');
const { MongoClient } = require('mongodb');
const moment = require('moment');

const app = express();
const port = 3000;

const mongoURI = 'mongodb+srv://admin:admin@twittme.cpsmh.mongodb.net/?retryWrites=true&w=majority&appName=twittme';
const dbName = 'twitterScraper';
const collectionName = 'tweets';

app.set('json spaces', 2);

function deduplicateTweets(tweets) {
  const uniqueTweets = {};
  tweets.forEach(tweet => {
    
    const tweetId = `${tweet.text.split('\n')[0]}-${tweet.time}`;
    
    
    const engagementMatch = tweet.text.match(/(\d+(?:\.\d+)?[KMB]?)\s*$/);
    let engagement = 0;
    if (engagementMatch) {
      const engagementStr = engagementMatch[1];
      engagement = parseFloat(engagementStr.replace(/[KMB]/g, ''));
      if (engagementStr.includes('K')) engagement *= 1000;
      if (engagementStr.includes('M')) engagement *= 1000000;
      if (engagementStr.includes('B')) engagement *= 1000000000;
    }

    if (!uniqueTweets[tweetId] || engagement > uniqueTweets[tweetId].engagement) {
      uniqueTweets[tweetId] = { ...tweet, engagement };
    }
  });
  return Object.values(uniqueTweets).sort((a, b) => new Date(b.time) - new Date(a.time));
}

app.get('/search/:keyword', async (req, res) => {
  console.log(`Received search request for keyword: ${req.params.keyword}`);
  const keyword = req.params.keyword;  
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const collection = client.db(dbName).collection(collectionName);

    
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = new RegExp(escapedKeyword, 'i');

    console.log(`Searching for tweets containing "${keyword}" (regex pattern: ${regexPattern})...`);
    
    const query = { text: regexPattern };
    console.log('MongoDB query:', JSON.stringify(query));

    
    console.log('Sample of tweets in the database:');
    const sampleDbTweets = await collection.find().limit(5).toArray();
    sampleDbTweets.forEach((tweet, index) => {
      console.log(`DB Tweet ${index + 1}:`, tweet.text);
    });

    const tweets = await collection.find(query).sort({ time: -1 }).toArray();
    console.log(`Found ${tweets.length} tweets containing "${keyword}"`);

    const dedupedTweets = deduplicateTweets(tweets);
    console.log(`After deduplication: ${dedupedTweets.length} unique tweets`);

    console.log('Deduplicated tweets:');
    dedupedTweets.forEach((tweet, index) => {
      console.log(`Tweet ${index + 1}:`, tweet.id, tweet.text.split('\n')[0], tweet.time);
    });

    const mentionsByDay = {};
    dedupedTweets.forEach(tweet => {
      const tweetDate = moment(tweet.time).format('YYYY-MM-DD');
      mentionsByDay[tweetDate] = (mentionsByDay[tweetDate] || 0) + 1;
    });

    const response = {
      keyword: keyword,
      totalMentions: dedupedTweets.length,
      mentionsByDay: mentionsByDay,
      tweets: dedupedTweets.map(tweet => ({
        id: tweet.id,
        time: tweet.time,
        text: tweet.text,
        link: tweet.link
      }))
    };

    console.log('Sending response...');
    
    const acceptHeader = req.get('Accept') || '';
    if (acceptHeader.includes('text/html')) {
      res.send(`
        <html>
          <head>
            <title>Search Results for "${keyword}"</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
              pre { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <h1>Search Results for "${keyword}"</h1>
            <pre>${JSON.stringify(response, null, 2)}</pre>
          </body>
        </html>
      `);
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Error occurred during search:', error);
    res.status(500).json({ error: 'An error occurred while searching tweets', details: error.message });
  } finally {
    if (client) {
      console.log('Closing MongoDB connection...');
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
});

app.listen(port, () => {
  console.log(`Tweet search API listening at http://localhost:${port}`);
});