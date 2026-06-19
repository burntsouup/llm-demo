require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/get-completion', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      max_tokens: 20,
      temperature: 0.1,
      logprobs: 5,
    });

    const choice = completion.choices[0];

    const logprobs = choice.logprobs;

    const tokensData = logprobs.tokens.map((token, idx) => {
      const mainLogprob = logprobs.token_logprobs[idx];
      const topCandidates = logprobs.top_logprobs[idx]; // an object of token -> logprob

      const mainProbability = Math.exp(mainLogprob);

      const candidateEntries = Object.entries(topCandidates).map(([tok, lp]) => {
        return { token: tok, probability: Math.exp(lp) };
      });
      candidateEntries.sort((a, b) => b.probability - a.probability);

      return {
        token: token,
        mainProbability: mainProbability,
        topCandidates: candidateEntries
      };
    });

    res.json({ tokensData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred.' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});