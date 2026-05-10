
class LottoBall extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const number = this.getAttribute('number');
    const color = this.getColorForNumber(parseInt(number, 10));

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --ball-color: ${color};
        }
        .ball {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--ball-color);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.5rem;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2), inset 0 -3px 5px rgba(0,0,0,0.3);
          text-shadow: 0 2px 3px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
        }
        .ball:hover {
            transform: scale(1.1);
        }
      </style>
      <div class="ball">${number}</div>
    `;
  }

  getColorForNumber(number) {
    if (number <= 10) return 'oklch(65% .24 30)'; // Reddish-Orange
    if (number <= 20) return 'oklch(75% .2 90)'; // Yellowish
    if (number <= 30) return 'oklch(60% .25 250)'; // Blueish
    if (number <= 40) return 'oklch(55% .15 150)'; // Greenish
    return 'oklch(50% 0 0)'; // Gray
  }
}

customElements.define('lotto-ball', LottoBall);

const generateBtn = document.getElementById('generate-btn');
const lottoNumbersContainer = document.getElementById('lotto-numbers');

generateBtn.addEventListener('click', () => {
  lottoNumbersContainer.innerHTML = '';
  const numbers = generateLottoNumbers();
  numbers.forEach(number => {
    const lottoBall = document.createElement('lotto-ball');
    lottoBall.setAttribute('number', number);
    lottoNumbersContainer.appendChild(lottoBall);
  });
});

function generateLottoNumbers() {
  const numbers = new Set();
  while (numbers.size < 6) {
    const randomNumber = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNumber);
  }
  return Array.from(numbers);
}
