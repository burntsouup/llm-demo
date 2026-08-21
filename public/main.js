document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submit-prompt');
  const promptInput = document.getElementById('prompt-input');
  const resultContainer = document.getElementById('result-container');

  function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 100%, 85%, 0.7)`;
  }

  function appendTooltipLine(container, text) {
    const line = document.createElement('div');
    line.textContent = text;
    container.appendChild(line);
  }

  async function submitPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      resultContainer.textContent = 'Please enter a prompt above.';
      return;
    }

    resultContainer.textContent = 'Loading...';
    submitButton.disabled = true;
    submitButton.textContent = 'Generating...';

    try {
      const response = await fetch('/api/get-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        resultContainer.textContent = errorData.error || 'Error fetching completion.';
        return;
      }

      const data = await response.json();
      const tokensData = data.tokensData || [];

      resultContainer.innerHTML = '';

      if (tokensData.length === 0) {
        resultContainer.textContent = 'The model did not return any tokens.';
        return;
      }

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
        const candidates = topCandidates
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 5);

        const chosenSection = document.createElement('div');
        chosenSection.className = 'mb-2';
        appendTooltipLine(chosenSection, `Chosen token: ${JSON.stringify(token)}`);
        appendTooltipLine(chosenSection, `Probability: ${tokenPercentage}%`);

        const separator = document.createElement('hr');
        separator.className = 'my-2';

        const candidatesSection = document.createElement('div');
        appendTooltipLine(candidatesSection, `Top ${candidates.length} tokens:`);
        candidates.forEach(({ token: candidateToken, probability }) => {
          appendTooltipLine(
            candidatesSection,
            `${JSON.stringify(candidateToken)} => ${(probability * 100).toFixed(2)}%`
          );
        });

        tooltip.appendChild(chosenSection);
        tooltip.appendChild(separator);
        tooltip.appendChild(candidatesSection);

        tokenWrapper.appendChild(tokenSpan);
        tokenWrapper.appendChild(tooltip);
        resultContainer.appendChild(tokenWrapper);
      });
    } catch (err) {
      resultContainer.textContent = 'Could not reach the demo server.';
      console.error(err);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  }

  submitButton.addEventListener('click', submitPrompt);
});
