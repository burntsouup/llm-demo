document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submit-prompt');
  const promptInput = document.getElementById('prompt-input');
  const resultContainer = document.getElementById('result-container');

  function isWordLike(str) {
    return /[A-Za-z0-9]/.test(str);
  }

  function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 100%, 85%, 0.7)`;
  }

  submitButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      resultContainer.textContent = 'Please enter a prompt above.';
      return;
    }

    resultContainer.textContent = 'Loading...';

    try {
      const response = await fetch('/api/get-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        resultContainer.textContent = 'Error fetching completion.';
        return;
      }

      const data = await response.json();
      const tokensData = data.tokensData;

      resultContainer.innerHTML = '';

      tokensData.forEach(({ token, mainProbability, topCandidates }) => {
        const tokenWrapper = document.createElement('span');
        tokenWrapper.className = 'relative group inline-block mx-1 mb-2';
        
        const tokenSpan = document.createElement('span');
        tokenSpan.className = 'px-2 py-1 rounded font-medium cursor-pointer';
        tokenSpan.style.backgroundColor = getRandomPastelColor();
        tokenSpan.textContent = token;

        const tooltip = document.createElement('div');
        tooltip.className = `
          absolute top-full left-0 z-10
          hidden group-hover:block
          w-56 p-3
          bg-white border border-gray-200
          rounded shadow-lg
          text-gray-800 text-sm
          mt-1
        `;

        const tokenPercentage = (mainProbability * 100).toFixed(2);

        const filteredCandidates = topCandidates
          .filter(({ token: cToken }) => isWordLike(cToken))
          .sort((a, b) => b.probability - a.probability);

        const topCount = Math.min(filteredCandidates.length, 5);

        let tooltipHTML = `
          <div class="mb-2">
            <strong>Chosen token:</strong> "${token}"<br />
            Probability: ${tokenPercentage}%
          </div>
          <hr class="my-2" />
          <div>
            <strong>Top ${topCount} tokens:</strong><br />
        `;
        for (let i = 0; i < topCount; i++) {
          const { token: cToken, probability } = filteredCandidates[i];
          tooltipHTML += `"${cToken}" => ${(probability * 100).toFixed(2)}%<br />`;
        }
        tooltipHTML += '</div>';

        tooltip.innerHTML = tooltipHTML;

        tokenWrapper.appendChild(tokenSpan);
        tokenWrapper.appendChild(tooltip);
        resultContainer.appendChild(tokenWrapper);
      });
    } catch (err) {
      resultContainer.textContent = 'An error occurred.';
      console.error(err);
    }
  });
});
