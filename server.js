require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo-instruct';

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/get-completion', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.completions.create({
      model,
      prompt,
      max_tokens: 20,
      temperature: 0.1,
      logprobs: 5,
    });

    const choice = completion.choices[0];
    const logprobs = choice.logprobs;
    if (!logprobs?.tokens || !logprobs?.token_logprobs || !logprobs?.top_logprobs) {
      throw new Error('The model response did not include token probabilities.');
    }

    const tokensData = logprobs.tokens.map((token, idx) => {
      const mainLogprob = logprobs.token_logprobs[idx];
      const topCandidates = logprobs.top_logprobs[idx] || {};

      const mainProbability = Number.isFinite(mainLogprob) ? Math.exp(mainLogprob) : 0;

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
    console.error('Completion request failed:', err.message);
    res.status(502).json({
      error: 'The model request failed. Check the API key, model, and server logs.'
    });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});