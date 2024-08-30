document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dcf-form');
    const cashFlowsInputs = document.getElementById('cash-flows-inputs');
    const resultDiv = document.getElementById('result');
    const intrinsicValueP = document.getElementById('intrinsic-value');
    const comparisonP = document.getElementById('comparison');
    const forecastYearsInput = document.getElementById('forecast-years');

    function addCashFlowInput(year) {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2';
        div.innerHTML = `
            <div class="flex-grow">
                <label for="cf-year-${year}" class="block text-sm font-medium text-gray-700 flex items-center" data-modal-text="Očekávaný peněžní tok pro tento rok v milionech Kč. Peněžní tok je rozdíl mezi příjmy a výdaji společnosti. Tyto hodnoty můžete odhadnout na základě historických dat z výkazu peněžních toků (Cash Flow Statement) a očekávaného růstu společnosti.">
                    Peněžní tok rok ${year} (Cash Flow Year ${year}) (v milionech Kč)
                    <span class="ml-1 modal-trigger cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                    </span>
                </label>
                <input type="number" id="cf-year-${year}" name="cf-year-${year}" placeholder="např. 100" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required>
            </div>
        `;
        cashFlowsInputs.appendChild(div);

        // Přidejte event listener pro nově vytvořený modal trigger
        const newModalTrigger = div.querySelector('.modal-trigger');
        addModalTriggerListener(newModalTrigger);
    }

    function updateCashFlowInputs() {
        const forecastYears = parseInt(forecastYearsInput.value);
        if (isNaN(forecastYears) || forecastYears < 1) {
            alert('Prosím zadejte platný počet let prognózy.');
            return;
        }

        while (cashFlowsInputs.firstChild) {
            cashFlowsInputs.removeChild(cashFlowsInputs.firstChild);
        }

        for (let i = 1; i <= forecastYears; i++) {
            addCashFlowInput(i);
        }
    }

    forecastYearsInput.addEventListener('change', updateCashFlowInputs);

    forecastYearsInput.value = 5;
    updateCashFlowInputs();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        try {
            const forecastYears = parseInt(forecastYearsInput.value);
            const discountRate = parseFloat(document.getElementById('discount-rate').value) / 100;
            const terminalGrowthRate = parseFloat(document.getElementById('terminal-growth-rate').value) / 100;
            const currentStockPrice = parseFloat(document.getElementById('current-stock-price').value);
            const sharesOutstanding = parseInt(document.getElementById('shares-outstanding').value) * 1000000; // Převod na skutečný počet akcií

            if (isNaN(forecastYears) || isNaN(discountRate) || isNaN(terminalGrowthRate) || isNaN(currentStockPrice) || isNaN(sharesOutstanding)) {
                throw new Error('Prosím vyplňte všechna pole správně.');
            }

            let presentValue = 0;
            const cashFlows = [];
            const cashFlowInputs = cashFlowsInputs.querySelectorAll('input[id^="cf-year-"]');
            if (cashFlowInputs.length !== forecastYears) {
                throw new Error(`Počet vstupních polí pro peněžní toky (${cashFlowInputs.length}) neodpovídá počtu let prognózy (${forecastYears}).`);
            }

            for (let i = 0; i < forecastYears; i++) {
                const cf = parseFloat(cashFlowInputs[i].value) * 1000000; // Převod na skutečnou hodnotu
                if (isNaN(cf)) {
                    throw new Error(`Prosím zadejte platnou hodnotu pro peněžní tok v roce ${i + 1}.`);
                }
                cashFlows.push(cf);
                presentValue += cf / Math.pow(1 + discountRate, i + 1);
            }

            const lastCF = cashFlows[cashFlows.length - 1];
            const terminalValue = (lastCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
            const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, forecastYears);

            const totalValue = presentValue + discountedTerminalValue;
            const intrinsicValue = totalValue / sharesOutstanding;

            intrinsicValueP.textContent = `Vnitřní hodnota akcie: ${intrinsicValue.toFixed(2)} Kč`;
            const comparison = ((intrinsicValue / currentStockPrice - 1) * 100).toFixed(2);
            comparisonP.textContent = `Akcie je ${comparison > 0 ? 'podhodnocená' : 'nadhodnocená'} o ${Math.abs(comparison)}%`;

            resultDiv.classList.remove('hidden');

            console.log('Vstupní hodnoty:', { forecastYears, discountRate, terminalGrowthRate, currentStockPrice, sharesOutstanding });
            console.log('Peněžní toky:', cashFlows);
            console.log('Současná hodnota budoucích peněžních toků:', presentValue);
            console.log('Terminální hodnota:', terminalValue);
            console.log('Diskontovaná terminální hodnota:', discountedTerminalValue);
            console.log('Celková hodnota:', totalValue);
            console.log('Vnitřní hodnota akcie:', intrinsicValue);
        } catch (error) {
            alert(error.message);
        }
    });
});

function calculateDCF(cashFlows, discountRate, terminalGrowthRate, sharesOutstanding) {
    let presentValue = 0;
    const forecastYears = cashFlows.length;

    for (let i = 0; i < forecastYears; i++) {
        presentValue += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }

    const lastCF = cashFlows[cashFlows.length - 1];
    const terminalValue = lastCF * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, forecastYears);

    const totalValue = presentValue + discountedTerminalValue;
    const intrinsicValue = totalValue / sharesOutstanding;

    return intrinsicValue;
}

// Exportujeme funkci, aby byla dostupná v jiných souborech
window.calculateDCF = calculateDCF;
