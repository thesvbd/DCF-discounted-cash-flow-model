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
                <label for="cf-year-${year}" class="block text-sm font-medium text-gray-700 flex items-center" data-modal-text="Expected cash flow for this year in millions of CZK. Cash flow is the difference between a company's income and expenses. You can estimate these values based on historical data from cash flow statements and expected company growth.">
                    Cash flow year ${year} (in millions CZK)
                    <span class="ml-1 modal-trigger cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                    </span>
                </label>
                <input type="number" id="cf-year-${year}" name="cf-year-${year}" placeholder="e.g. 100" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required>
            </div>
        `;
        cashFlowsInputs.appendChild(div);

        // Add event listener for newly created modal trigger
        const newModalTrigger = div.querySelector('.modal-trigger');
        addModalTriggerListener(newModalTrigger);
    }

    function updateCashFlowInputs() {
        const forecastYears = parseInt(forecastYearsInput.value);
        if (isNaN(forecastYears) || forecastYears < 1) {
            alert('Please enter a valid number of forecast years.');
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
            const sharesOutstanding = parseInt(document.getElementById('shares-outstanding').value) * 1000000; // Convert to actual number of shares

            if (isNaN(forecastYears) || isNaN(discountRate) || isNaN(terminalGrowthRate) || isNaN(currentStockPrice) || isNaN(sharesOutstanding)) {
                throw new Error('Please fill in all fields correctly.');
            }

            let presentValue = 0;
            const cashFlows = [];
            const cashFlowInputs = cashFlowsInputs.querySelectorAll('input[id^="cf-year-"]');
            if (cashFlowInputs.length !== forecastYears) {
                throw new Error(`The number of cash flow input fields (${cashFlowInputs.length}) does not match the number of forecast years (${forecastYears}).`);
            }

            for (let i = 0; i < forecastYears; i++) {
                const cf = parseFloat(cashFlowInputs[i].value) * 1000000; // Convert to actual value
                if (isNaN(cf)) {
                    throw new Error(`Please enter a valid value for cash flow in year ${i + 1}.`);
                }
                cashFlows.push(cf);
                presentValue += cf / Math.pow(1 + discountRate, i + 1);
            }

            const lastCF = cashFlows[cashFlows.length - 1];
            const terminalValue = (lastCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
            const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, forecastYears);

            const totalValue = presentValue + discountedTerminalValue;
            const intrinsicValue = totalValue / sharesOutstanding;

            intrinsicValueP.textContent = `Intrinsic value of the stock: ${intrinsicValue.toFixed(2)} CZK`;
            const comparison = ((intrinsicValue / currentStockPrice - 1) * 100).toFixed(2);
            comparisonP.textContent = `The stock is ${comparison > 0 ? 'undervalued' : 'overvalued'} by ${Math.abs(comparison)}%`;

            resultDiv.classList.remove('hidden');

            console.log('Input values:', { forecastYears, discountRate, terminalGrowthRate, currentStockPrice, sharesOutstanding });
            console.log('Cash flows:', cashFlows);
            console.log('Present value of future cash flows:', presentValue);
            console.log('Terminal value:', terminalValue);
            console.log('Discounted terminal value:', discountedTerminalValue);
            console.log('Total value:', totalValue);
            console.log('Intrinsic value of the stock:', intrinsicValue);
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

// Export the function to make it available in other files
window.calculateDCF = calculateDCF;
