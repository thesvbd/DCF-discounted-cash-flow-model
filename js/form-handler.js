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
                <label for="cf-year-${year}" class="block text-sm font-medium text-gray-700 flex items-center" data-modal-text="Očekávaný peněžní tok pro tento rok v milionech. Peněžní tok je rozdíl mezi příjmy a výdaji společnosti. Tyto hodnoty můžete odhadnout na základě historických dat z výkazu peněžních toků (Cash Flow Statement) a očekávaného růstu společnosti.">
                    Peněžní tok rok ${year} (Cash Flow Year ${year}) (v milionech&nbsp;<span class="currency-span">${currencySelect.value}</span>)
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
        updateCurrency(); // Přidáno: aktualizace měny po přidání nového vstupu

        // Přidejte event listener pro nově vytvořený modal trigger
        const newModalTrigger = div.querySelector('.modal-trigger');
        if (window.addModalTriggerListener) {
            window.addModalTriggerListener(newModalTrigger);
        } else {
            console.error('Funkce addModalTriggerListener není dostupná');
        }
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
        updateCurrency(); // Přidáno: aktualizace měny po přidání všech vstupů
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
                    throw new Error(`Prosím zadejte platnou hodnotu pro peněžní tok v roce ${i + 1}.`);
                }
                cashFlows.push(cf);
            }

            const intrinsicValue = calculateDCF(cashFlows, discountRate, terminalGrowthRate, sharesOutstanding);

            // Vyčistíme předchozí výsledky
            intrinsicValueP.innerHTML = '';
            comparisonP.innerHTML = '';
            const existingExplanation = resultDiv.querySelector('.explanation');
            if (existingExplanation) {
                existingExplanation.remove();
            }

            intrinsicValueP.textContent = `Vnitřní hodnota akcie: `;
            const valueSpan = document.createElement('span');
            valueSpan.textContent = `${intrinsicValue.toFixed(2)} ${selectedCurrency}`;
            valueSpan.className = 'result-value';
            intrinsicValueP.appendChild(valueSpan);

            const comparison = ((intrinsicValue / currentStockPrice - 1) * 100).toFixed(2);
            comparisonP.textContent = `Akcie je ${comparison > 0 ? 'podhodnocená' : 'nadhodnocená'} o `;
            const comparisonSpan = document.createElement('span');
            comparisonSpan.textContent = `${Math.abs(comparison)}%`;
            comparisonSpan.className = 'result-comparison';
            comparisonP.appendChild(comparisonSpan);

            // Přidáme vysvětlivky
            const explanationP = document.createElement('p');
            explanationP.className = 'mt-4 text-sm text-gray-600 explanation';
            explanationP.innerHTML = `
                <strong>Jak se to počítá?</strong><br>
                1. Vypočítáme vnitřní hodnotu akcie pomocí modelu DCF (Discounted Cash Flow).<br>
                2. Porovnáme vypočítanou vnitřní hodnotu (${intrinsicValue.toFixed(2)} ${selectedCurrency}) s aktuální tržní cenou (${currentStockPrice} ${selectedCurrency}).<br>
                3. Rozdíl mezi těmito hodnotami určuje, zda je akcie podhodnocená nebo nadhodnocená.<br>
                <br>
                <strong>Co to znamená?</strong><br>
                - Pokud je akcie <em>podhodnocená</em>, model naznačuje, že by mohla mít potenciál k růstu.<br>
                - Pokud je akcie <em>nadhodnocená</em>, model naznačuje, že by mohla být v současnosti přeceněná.<br>
                <br>
                <strong>Upozornění:</strong> Toto hodnocení je založeno na zadaných vstupních datech a předpokladech modelu DCF. Vždy provádějte vlastní analýzu a nepoužívejte toto jako jediný zdroj pro investiční rozhodnutí.
            `;

            resultDiv.appendChild(explanationP);
            resultDiv.classList.remove('hidden');

            console.log('Vstupní hodnoty:', { forecastYears, discountRate, terminalGrowthRate, currentStockPrice, sharesOutstanding });
            console.log('Peněžní toky:', cashFlows);
            console.log('Vnitřní hodnota akcie:', intrinsicValue);
        } catch (error) {
            // Použijeme globální funkci openModal
            window.openModal('Chyba', error.message);
        }
    });

    // Inicializace měny při načtení stránky
    updateCurrency();
});
