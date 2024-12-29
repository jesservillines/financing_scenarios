document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mortgageForm');
    const loanTypeInputs = document.getElementsByName('loanType');
    const armDetails = document.getElementById('armDetails');
    const interestOnlyDetails = document.getElementById('interestOnlyDetails');
    const transitionRateGroup = document.getElementById('transitionRateGroup');
    const scenariosList = document.getElementById('scenariosList');

    // Show/hide loan type details
    loanTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            armDetails.classList.toggle('d-none', this.value !== 'arm');
            interestOnlyDetails.classList.toggle('d-none', !['interest_only', 'interest_only_hybrid'].includes(this.value));
            transitionRateGroup.classList.toggle('d-none', this.value !== 'interest_only_hybrid');
        });
    });

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Format percentage
    function formatPercent(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2
        }).format(value / 100);
    }

    // Create scenario card
    function createScenarioCard(scenario) {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        
        let monthlyPaymentText = '';
        if (scenario.monthly_payment.interest_only !== null) {
            monthlyPaymentText += `Interest Only: ${formatCurrency(scenario.monthly_payment.interest_only)}<br>`;
        }
        if (scenario.monthly_payment.amortizing !== null) {
            monthlyPaymentText += `Amortizing: ${formatCurrency(scenario.monthly_payment.amortizing)}`;
        }
        if (!monthlyPaymentText) {
            monthlyPaymentText = formatCurrency(scenario.monthly_payment.overall);
        }

        card.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title">${scenario.scenario_name}</h5>
                        <button class="btn btn-sm btn-danger delete-scenario" data-scenario="${scenario.scenario_name}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <p class="mb-1">Loan Type: ${scenario.loan_details.loan_type}</p>
                    <p class="mb-1">Monthly Payment:<br>${monthlyPaymentText}</p>
                    <p class="mb-1">Interest Rate: ${formatPercent(scenario.loan_details.interest_rate)}</p>
                    <p class="mb-0">NPV: ${formatCurrency(scenario.npv)}</p>
                </div>
            </div>
        `;
        
        const deleteBtn = card.querySelector('.delete-scenario');
        deleteBtn.addEventListener('click', () => deleteScenario(scenario.scenario_name));
        
        return card;
    }

    // Update comparison charts
    function updateCharts(scenarios) {
        const scenarioNames = Object.keys(scenarios);
        
        // Monthly Payments Comparison
        const monthlyPaymentsData = [{
            x: scenarioNames,
            y: scenarioNames.map(name => scenarios[name].monthly_payment.overall),
            type: 'bar',
            name: 'Monthly Payment'
        }];
        
        Plotly.newPlot('monthlyPaymentsChart', monthlyPaymentsData, {
            height: 300,
            margin: { t: 20, b: 40, l: 60, r: 20 },
            yaxis: { title: 'Monthly Payment ($)' }
        });

        // Total Interest Comparison
        const totalInterestData = [{
            x: scenarioNames,
            y: scenarioNames.map(name => scenarios[name].total_interest),
            type: 'bar',
            name: 'Total Interest'
        }];
        
        Plotly.newPlot('totalInterestChart', totalInterestData, {
            height: 300,
            margin: { t: 20, b: 40, l: 60, r: 20 },
            yaxis: { title: 'Total Interest ($)' }
        });

        // Balance Over Time
        const balanceData = scenarioNames.map(name => ({
            x: scenarios[name].amortization_schedule.map(row => row.month),
            y: scenarios[name].amortization_schedule.map(row => row.ending_balance),
            type: 'scatter',
            mode: 'lines',
            name: name
        }));
        
        Plotly.newPlot('balanceChart', balanceData, {
            height: 300,
            margin: { t: 20, b: 40, l: 60, r: 20 },
            xaxis: { title: 'Month' },
            yaxis: { title: 'Balance ($)' }
        });
    }

    // Update comparison table
    function updateComparisonTable(scenarios) {
        const table = document.getElementById('comparisonTable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // Clear existing scenario columns
        while (thead.children.length > 1) {
            thead.removeChild(thead.lastChild);
        }
        
        // Add scenario columns to header
        Object.keys(scenarios).forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            thead.appendChild(th);
        });
        
        // Update table rows
        const metrics = [
            { key: 'monthly_payment.interest_only', label: 'Monthly Payment (Interest Only Phase)' },
            { key: 'monthly_payment.amortizing', label: 'Monthly Payment (Amortizing Phase)' },
            { key: 'monthly_payment.overall', label: 'Average Monthly Payment' },
            { key: 'total_interest', label: 'Total Interest' },
            { key: 'total_payments', label: 'Total Payments' },
            { key: 'npv', label: 'Net Present Value (NPV)' },
            { key: 'tax_savings', label: 'Tax Savings' },
            { key: 'effective_cost', label: 'Effective Cost' }
        ];
        
        metrics.forEach((metric, index) => {
            const row = tbody.children[index];
            // Clear existing cells except the first one (metric name)
            while (row.children.length > 1) {
                row.removeChild(row.lastChild);
            }
            
            // Add values for each scenario
            Object.values(scenarios).forEach(scenario => {
                const td = document.createElement('td');
                // Handle nested properties (e.g., monthly_payment.interest_only)
                const value = metric.key.split('.').reduce((obj, key) => obj?.[key], scenario);
                td.textContent = value !== null ? formatCurrency(value) : 'N/A';
                row.appendChild(td);
            });
        });
    }

    // Delete scenario
    async function deleteScenario(scenarioName) {
        try {
            await fetch(`/api/scenarios/${encodeURIComponent(scenarioName)}`, {
                method: 'DELETE'
            });
            await loadScenarios();
        } catch (error) {
            console.error('Error deleting scenario:', error);
        }
    }

    // Load and display scenarios
    async function loadScenarios() {
        try {
            const response = await fetch('/api/scenarios');
            const scenarios = await response.json();
            
            // Clear existing scenarios
            scenariosList.innerHTML = '';
            
            // Add scenario cards
            Object.values(scenarios).forEach(scenario => {
                scenariosList.appendChild(createScenarioCard(scenario));
            });
            
            // Update comparison visualizations
            if (Object.keys(scenarios).length > 0) {
                updateCharts(scenarios);
                updateComparisonTable(scenarios);
            }
        } catch (error) {
            console.error('Error loading scenarios:', error);
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const scenarios = await (await fetch('/api/scenarios')).json();
        if (Object.keys(scenarios).length >= 3) {
            alert('Maximum of 3 scenarios reached. Please delete a scenario before adding a new one.');
            return;
        }

        const formData = {
            scenario_name: document.getElementById('scenarioName').value,
            home_price: parseFloat(document.getElementById('homePrice').value),
            down_payment: parseFloat(document.getElementById('downPayment').value),
            interest_rate: parseFloat(document.getElementById('interestRate').value),
            loan_term: parseInt(document.getElementById('loanTerm').value),
            loan_type: document.querySelector('input[name="loanType"]:checked').value,
            tax_bracket: parseFloat(document.getElementById('taxBracket').value) || null,
            risk_free_rate: parseFloat(document.getElementById('riskFreeRate').value) || null
        };

        if (formData.loan_type === 'arm') {
            formData.arm_details = {
                initial_period: parseInt(document.getElementById('armPeriod').value),
                adjustment_frequency: 1,
                expected_rates: [formData.interest_rate + 1] // Simple assumption for demo
            };
        }

        if (['interest_only', 'interest_only_hybrid'].includes(formData.loan_type)) {
            formData.interest_only_details = {
                interest_only_period: parseInt(document.getElementById('interestOnlyPeriod').value),
                transition_rate: formData.loan_type === 'interest_only_hybrid' ? 
                    parseFloat(document.getElementById('transitionRate').value) : null
            };
        }

        try {
            await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // Reset form
            form.reset();
            
            // Reload scenarios
            await loadScenarios();

        } catch (error) {
            console.error('Error calculating mortgage:', error);
            alert('Error calculating mortgage. Please try again.');
        }
    });

    // Initial load of scenarios
    loadScenarios();
});
