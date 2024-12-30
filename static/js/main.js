document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mortgageForm');
    const loanTypeInputs = document.getElementsByName('loanType');
    const armDetails = document.getElementById('armDetails');
    const interestOnlyDetails = document.getElementById('interestOnlyDetails');
    const transitionRateGroup = document.getElementById('transitionRateGroup');
    const scenariosList = document.getElementById('scenariosList');
    const propertyTaxRateInput = document.getElementById('propertyTaxRate');
    const insuranceCostInput = document.getElementById('insuranceCost');
    const pmiRateInput = document.getElementById('pmiRate');
    const pmiDetails = document.getElementById('pmiDetails');

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

    // Color mapping for scenarios
    const defaultColors = [
        '#2ecc71', // Green
        '#3498db', // Blue
        '#e67e22', // Orange
        '#9b59b6', // Purple
        '#e74c3c', // Red
        '#1abc9c'  // Turquoise
    ];

    const colorMap = {};
    let nextColorIndex = 0;

    function getScenarioColor(scenarioName) {
        if (!colorMap[scenarioName]) {
            // Reset color index if we've used all colors
            if (nextColorIndex >= defaultColors.length) {
                nextColorIndex = 0;
            }
            colorMap[scenarioName] = defaultColors[nextColorIndex];
            nextColorIndex++;
        }
        return colorMap[scenarioName];
    }

    // Clear color mapping when all scenarios are removed
    function clearColorMap() {
        for (let key in colorMap) {
            delete colorMap[key];
        }
        nextColorIndex = 0;
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

        const scenarioColor = getScenarioColor(scenario.scenario_name);
        
        card.innerHTML = `
            <div class="card" style="border-left: 5px solid ${scenarioColor}">
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

    // Create payment breakdown pie charts
    function createPaymentBreakdownChart(scenario, additionalCosts) {
        const container = document.getElementById('paymentBreakdownChart');
        container.innerHTML = ''; // Clear existing content

        // Create two sub-containers for hybrid loans
        if (scenario.loan_details.loan_type === 'interest_only_hybrid') {
            container.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div id="paymentBreakdownChart1"></div>
                    </div>
                    <div class="col-md-6">
                        <div id="paymentBreakdownChart2"></div>
                    </div>
                </div>
            `;
            
            // Phase 1: Interest Only Period
            const phase1Data = [{
                values: [
                    scenario.monthly_payment.interest_only,
                    additionalCosts.propertyTax,
                    additionalCosts.insurance,
                    additionalCosts.pmi
                ],
                labels: [
                    'Interest Only',
                    'Property Tax',
                    'Insurance',
                    'PMI'
                ],
                type: 'pie',
                hole: 0.4,
                marker: {
                    colors: [
                        '#2ecc71',
                        '#3498db',
                        '#e67e22',
                        '#e74c3c'
                    ]
                },
                textinfo: 'label+percent',
                hovertemplate: '%{label}<br>$%{value:.2f}/month<br>%{percent}<extra></extra>'
            }];

            const phase1Layout = {
                title: 'Interest Only Phase',
                showlegend: true,
                height: 400,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 40, b: 80, l: 20, r: 20 }
            };

            // Phase 2: Amortizing Period
            const phase2Data = [{
                values: [
                    scenario.monthly_payment.amortizing,
                    additionalCosts.propertyTax,
                    additionalCosts.insurance,
                    additionalCosts.pmi
                ],
                labels: [
                    'Principal & Interest',
                    'Property Tax',
                    'Insurance',
                    'PMI'
                ],
                type: 'pie',
                hole: 0.4,
                marker: {
                    colors: [
                        '#2ecc71',
                        '#3498db',
                        '#e67e22',
                        '#e74c3c'
                    ]
                },
                textinfo: 'label+percent',
                hovertemplate: '%{label}<br>$%{value:.2f}/month<br>%{percent}<extra></extra>'
            }];

            const phase2Layout = {
                title: 'Amortizing Phase',
                showlegend: true,
                height: 400,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 40, b: 80, l: 20, r: 20 }
            };

            Plotly.newPlot('paymentBreakdownChart1', phase1Data, phase1Layout);
            Plotly.newPlot('paymentBreakdownChart2', phase2Data, phase2Layout);
        } else {
            // Regular single-phase loan
            const data = [{
                values: [
                    scenario.monthly_payment.overall,
                    additionalCosts.propertyTax,
                    additionalCosts.insurance,
                    additionalCosts.pmi
                ],
                labels: [
                    'Principal & Interest',
                    'Property Tax',
                    'Insurance',
                    'PMI'
                ],
                type: 'pie',
                hole: 0.4,
                marker: {
                    colors: [
                        '#2ecc71',
                        '#3498db',
                        '#e67e22',
                        '#e74c3c'
                    ]
                },
                textinfo: 'label+percent',
                hovertemplate: '%{label}<br>$%{value:.2f}/month<br>%{percent}<extra></extra>'
            }];

            const layout = {
                title: 'Monthly Payment Breakdown',
                showlegend: true,
                height: 400,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 40, b: 80, l: 20, r: 20 }
            };

            Plotly.newPlot('paymentBreakdownChart', data, layout);
        }
    }

    // Update monthly payments comparison chart
    function createMonthlyPaymentsChart(scenarios) {
        const monthlyPaymentsData = [];
        
        Object.entries(scenarios).forEach(([name, scenario]) => {
            const color = getScenarioColor(name);
            
            if (scenario.loan_details.loan_type === 'interest_only_hybrid') {
                // Add interest-only phase
                monthlyPaymentsData.push({
                    x: [scenario.scenario_name],
                    y: [scenario.monthly_payment.interest_only],
                    type: 'bar',
                    name: `${scenario.scenario_name} (Interest Only)`,
                    marker: { color: color },
                    hovertemplate: 'Interest Only Phase<br>$%{y:.2f}/month<extra></extra>'
                });
                
                // Add amortizing phase
                monthlyPaymentsData.push({
                    x: [scenario.scenario_name],
                    y: [scenario.monthly_payment.amortizing],
                    type: 'bar',
                    name: `${scenario.scenario_name} (Amortizing)`,
                    marker: { color: color, pattern: { type: 'lines' } },
                    hovertemplate: 'Amortizing Phase<br>$%{y:.2f}/month<extra></extra>'
                });
            } else {
                monthlyPaymentsData.push({
                    x: [scenario.scenario_name],
                    y: [scenario.monthly_payment.overall],
                    type: 'bar',
                    name: scenario.scenario_name,
                    marker: { color: color },
                    hovertemplate: '$%{y:.2f}/month<extra></extra>'
                });
            }
        });

        const monthlyPaymentsLayout = {
            title: 'Monthly Payments Comparison',
            showlegend: true,
            barmode: 'group',
            height: 400,
            legend: {
                orientation: 'h',
                y: -0.2,
                x: 0.5,
                xanchor: 'center'
            },
            yaxis: {
                title: 'Monthly Payment ($)',
                automargin: true,
                tickformat: ',.0f'
            },
            xaxis: {
                automargin: true
            },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        };

        Plotly.newPlot('monthlyPaymentsChart', monthlyPaymentsData, monthlyPaymentsLayout);
    }

    // Update charts
    function updateCharts(scenarios) {
        const scenarioNames = Object.keys(scenarios);
        
        // Create chart container if it doesn't exist
        let chartsContainer = document.getElementById('chartsContainer');
        if (!chartsContainer) {
            chartsContainer = document.createElement('div');
            chartsContainer.id = 'chartsContainer';
            chartsContainer.className = 'row mt-4';
            document.querySelector('.main-content').appendChild(chartsContainer);
        }
        chartsContainer.innerHTML = `
            <div class="col-12">
                <div class="card mb-4">
                    <div class="card-body">
                        <div id="monthlyPaymentsChart" class="chart-container"></div>
                        <div id="totalInterestChart" class="chart-container mt-4"></div>
                        <div id="balanceChart" class="chart-container mt-4"></div>
                        <div id="paymentBreakdownChart" class="chart-container mt-4"></div>
                    </div>
                </div>
            </div>
        `;

        // Monthly Payments Comparison
        createMonthlyPaymentsChart(scenarios);

        // Total Interest Comparison
        const totalInterestData = scenarioNames.map(name => ({
            x: [scenarios[name].scenario_name],
            y: [scenarios[name].total_interest],
            type: 'bar',
            name: scenarios[name].scenario_name,
            marker: {
                color: getScenarioColor(name)
            }
        }));

        const totalInterestLayout = {
            title: 'Total Interest Comparison',
            showlegend: true,
            barmode: 'group',
            height: 400,
            legend: {
                orientation: 'h',
                y: -0.2,
                x: 0.5,
                xanchor: 'center'
            },
            yaxis: {
                title: 'Total Interest ($)',
                automargin: true,
                tickformat: ',.0f'
            },
            xaxis: {
                automargin: true
            },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        };

        Plotly.newPlot('totalInterestChart', totalInterestData, totalInterestLayout);

        // Balance Over Time
        const balanceData = scenarioNames.map(name => {
            const scenario = scenarios[name];
            return {
                x: scenario.amortization_schedule.map(entry => entry.month),
                y: scenario.amortization_schedule.map(entry => entry.ending_balance),
                type: 'scatter',
                mode: 'lines',
                name: scenario.scenario_name,
                line: {
                    color: getScenarioColor(name),
                    width: 3
                }
            };
        });

        const balanceLayout = {
            title: 'Balance Over Time',
            showlegend: true,
            height: 400,
            legend: {
                orientation: 'h',
                y: -0.2,
                x: 0.5,
                xanchor: 'center'
            },
            yaxis: {
                title: 'Balance ($)',
                automargin: true,
                tickformat: ',.0f'
            },
            xaxis: {
                title: 'Month',
                automargin: true
            },
            margin: { t: 40, b: 80, l: 60, r: 40 }
        };

        Plotly.newPlot('balanceChart', balanceData, balanceLayout);

        // Payment Breakdown
        createPaymentBreakdownChart(scenarios[scenarioNames[0]], calculateMonthlyCosts(scenarios[scenarioNames[0]]));
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
            const response = await fetch(`/api/scenarios/${scenarioName}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove the color mapping for this scenario
                delete colorMap[scenarioName];
                
                // Refresh scenarios
                const scenarios = await (await fetch('/api/scenarios')).json();
                
                // If no scenarios left, reset color mapping
                if (Object.keys(scenarios).length === 0) {
                    clearColorMap();
                }
                
                updateUI(scenarios);
            }
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

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Show/hide PMI details based on down payment percentage
    function updatePMIVisibility() {
        const homePrice = parseFloat(document.getElementById('homePrice').value);
        const downPayment = parseFloat(document.getElementById('downPayment').value);
        const pmiDetails = document.getElementById('pmiDetails');
        
        if (homePrice && downPayment) {
            const downPaymentPercent = (downPayment / homePrice) * 100;
            pmiDetails.classList.toggle('d-none', downPaymentPercent >= 20);
        }
    }

    document.getElementById('homePrice').addEventListener('input', updatePMIVisibility);
    document.getElementById('downPayment').addEventListener('input', updatePMIVisibility);

    // Calculate monthly costs
    function calculateMonthlyCosts(scenario) {
        const homePrice = parseFloat(scenario.loan_details.home_price);
        const propertyTaxRate = parseFloat(propertyTaxRateInput.value) || 1.1;
        const annualInsurance = parseFloat(insuranceCostInput.value) || 1200;
        const downPaymentPercent = (scenario.loan_details.down_payment / homePrice) * 100;
        const pmiRate = parseFloat(pmiRateInput.value) || 0.5;

        // Calculate monthly property tax
        const monthlyPropertyTax = (homePrice * (propertyTaxRate / 100)) / 12;

        // Calculate monthly insurance
        const monthlyInsurance = annualInsurance / 12;

        // Calculate monthly PMI if down payment is less than 20%
        const monthlyPMI = downPaymentPercent < 20 ? 
            ((homePrice - scenario.loan_details.down_payment) * (pmiRate / 100)) / 12 : 0;

        return {
            propertyTax: monthlyPropertyTax,
            insurance: monthlyInsurance,
            pmi: monthlyPMI
        };
    }

    // Initial load of scenarios
    loadScenarios();
});
