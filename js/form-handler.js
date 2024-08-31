document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dcf-form');
    const cashFlowsInputs = document.getElementById('cash-flows-inputs');
    const resultDiv = document.getElementById('result');
    const intrinsicValueP = document.getElementById('intrinsic-value');
    const comparisonP = document.getElementById('comparison');
    const forecastYearsInput = document.getElementById('forecast-years');
    const currencySelect = document.getElementById('currency');
    const currencySpans = document.querySelectorAll('.currency-span');

    function updateCurrency() {
        const selectedCurrency = currencySelect.value;
        document.querySelectorAll('.currency-span').forEach(span => {
            span.textContent = selectedCurrency;
        });
    }

    currencySelect.addEventListener('change', updateCurrency);

    function addCashFlowInput(year) {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2';
        div.innerHTML = `
            <div class="flex-grow">
                <label for="cf-year-${year}" class="block text-sm font-medium text-gray-700 flex items-center" data-modal-text="Expected cash flow for this year in millions. Cash flow is the difference between a company's income and expenses. You can estimate these values based on historical data from the Cash Flow Statement and expected company growth.">
                    Cash Flow Year ${year} (in millions&nbsp;<span class="currency-span">${currencySelect.value}</span>)
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
        updateCurrency(); // Added: update currency after adding new input

        // Add event listener for newly created modal trigger
        const newModalTrigger = div.querySelector('.modal-trigger');
        if (window.addModalTriggerListener) {
            window.addModalTriggerListener(newModalTrigger);
        } else {
            console.error('Function addModalTriggerListener is not available');
        }
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
        updateCurrency(); // Added: update currency after adding all inputs
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
            const sharesOutstanding = parseFloat(document.getElementById('shares-outstanding').value) * 1000000;
            const selectedCurrency = currencySelect.value;

            const cashFlows = [];
            const cashFlowInputs = cashFlowsInputs.querySelectorAll('input[id^="cf-year-"]');
            for (let i = 0; i < forecastYears; i++) {
                const cf = parseFloat(cashFlowInputs[i].value) * 1000000;
                if (isNaN(cf)) {
                    throw new Error(`Please enter a valid value for cash flow in year ${i + 1}.`);
                }
                cashFlows.push(cf);
            }

            const intrinsicValue = calculateDCF(cashFlows, discountRate, terminalGrowthRate, sharesOutstanding);

            // Clear previous results
            intrinsicValueP.innerHTML = '';
            comparisonP.innerHTML = '';
            const existingExplanation = resultDiv.querySelector('.explanation');
            if (existingExplanation) {
                existingExplanation.remove();
            }

            intrinsicValueP.textContent = `Intrinsic value of the stock: `;
            const valueSpan = document.createElement('span');
            valueSpan.textContent = `${intrinsicValue.toFixed(2)} ${selectedCurrency}`;
            valueSpan.className = 'result-value';
            intrinsicValueP.appendChild(valueSpan);

            const comparison = ((intrinsicValue / currentStockPrice - 1) * 100).toFixed(2);
            comparisonP.textContent = `The stock is ${comparison > 0 ? 'undervalued' : 'overvalued'} by `;
            const comparisonSpan = document.createElement('span');
            comparisonSpan.textContent = `${Math.abs(comparison)}%`;
            comparisonSpan.className = 'result-comparison';
            comparisonP.appendChild(comparisonSpan);

            // Add explanations
            const explanationP = document.createElement('p');
            explanationP.className = 'mt-4 text-sm text-gray-600 explanation';
            explanationP.innerHTML = `
                <strong>How is this calculated?</strong><br>
                1. We calculate the intrinsic value of the stock using the DCF (Discounted Cash Flow) model.<br>
                2. We compare the calculated intrinsic value (${intrinsicValue.toFixed(2)} ${selectedCurrency}) with the current market price (${currentStockPrice} ${selectedCurrency}).<br>
                3. The difference between these values determines whether the stock is undervalued or overvalued.<br>
                <br>
                <strong>What does this mean?</strong><br>
                - If the stock is <em>undervalued</em>, the model suggests it might have potential for growth.<br>
                - If the stock is <em>overvalued</em>, the model suggests it might be currently overpriced.<br>
                <br>
                <strong>Disclaimer:</strong> This assessment is based on the input data and assumptions of the DCF model. Always conduct your own analysis and do not use this as the sole source for investment decisions.
            `;

            resultDiv.appendChild(explanationP);
            resultDiv.classList.remove('hidden');

            console.log('Input values:', { forecastYears, discountRate, terminalGrowthRate, currentStockPrice, sharesOutstanding });
            console.log('Cash flows:', cashFlows);
            console.log('Intrinsic value of the stock:', intrinsicValue);
        } catch (error) {
            // Use the global openModal function
            window.openModal('Error', error.message);
        }
    });

    // Initialize currency on page load
    currencySelect.value = '$';
    updateCurrency();

});
