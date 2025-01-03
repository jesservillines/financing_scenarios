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
        if (value === null || value === undefined) return 'N/A';
        return (value * 100).toFixed(1) + '%';
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
        
        // Format tax bracket and interest rate
        const taxBracket = scenario.loan_details.tax_bracket !== null && scenario.loan_details.tax_bracket !== undefined 
            ? scenario.loan_details.tax_bracket.toFixed(1) + '%' 
            : 'N/A';
        
        const interestRate = scenario.loan_details.interest_rate.toFixed(2) + '%';
        
        // Get additional loan details
        const loanType = scenario.loan_details.loan_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const loanTerm = scenario.loan_details.loan_term + ' Years';
        const propertyTaxRate = scenario.loan_details.property_tax_rate.toFixed(2) + '%';
        const homePrice = formatCurrency(scenario.loan_details.home_price);
        const downPayment = formatCurrency(scenario.loan_details.down_payment);
        const downPaymentPercent = ((scenario.loan_details.down_payment / scenario.loan_details.home_price) * 100).toFixed(1) + '%';
        
        card.innerHTML = `
            <div class="card" style="border-left: 5px solid ${scenarioColor}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title">${scenario.scenario_name}</h5>
                        <button class="btn btn-sm btn-danger delete-scenario" data-scenario="${scenario.scenario_name}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <div class="scenario-details">
                        <p class="mb-1"><strong>Home Price:</strong> ${homePrice}</p>
                        <p class="mb-1"><strong>Down Payment:</strong> ${downPayment} (${downPaymentPercent})</p>
                        <p class="mb-1"><strong>Loan Type:</strong> ${loanType}</p>
                        <p class="mb-1"><strong>Loan Term:</strong> ${loanTerm}</p>
                        <p class="mb-1"><strong>Interest Rate:</strong> ${interestRate}</p>
                        <p class="mb-1"><strong>Monthly Payment:</strong><br>${monthlyPaymentText}</p>
                        <p class="mb-1"><strong>Property Tax Rate:</strong> ${propertyTaxRate}</p>
                        <p class="mb-1"><strong>Tax Bracket:</strong> ${taxBracket}</p>
                        <p class="mb-0"><strong>NPV:</strong> ${formatCurrency(scenario.npv)}</p>
                    </div>
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
                title: {
                    text: 'Interest Only Phase',
                    y: 0.95
                },
                showlegend: true,
                height: 350,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 30, b: 80, l: 20, r: 20 }
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
                title: {
                    text: 'Amortizing Phase',
                    y: 0.95
                },
                showlegend: true,
                height: 350,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 30, b: 80, l: 20, r: 20 }
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
                title: {
                    text: 'Monthly Payment Breakdown',
                    y: 0.95
                },
                showlegend: true,
                height: 350,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 30, b: 80, l: 20, r: 20 }
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
                    marker: { color: adjustBrightness(color, -40) },  // Darker shade
                    hovertemplate: 'Interest Only Phase<br>$%{y:.2f}/month<extra></extra>'
                });
                
                // Add amortizing phase
                monthlyPaymentsData.push({
                    x: [scenario.scenario_name],
                    y: [scenario.monthly_payment.amortizing],
                    type: 'bar',
                    name: `${scenario.scenario_name} (Amortizing)`,
                    marker: { color: color },
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
            margin: { t: 30, b: 80, l: 60, r: 40 }
        };

        Plotly.newPlot('monthlyPaymentsChart', monthlyPaymentsData, monthlyPaymentsLayout);
    }

    // Function to adjust color brightness
    function adjustBrightness(color, amount) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Adjust brightness
        const newR = Math.min(255, Math.max(0, r + amount));
        const newG = Math.min(255, Math.max(0, g + amount));
        const newB = Math.min(255, Math.max(0, b + amount));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Create year-by-year summary data
    function createYearlyData(scenario) {
        const yearlyData = {};
        const schedule = scenario.amortization_schedule;
        
        for (let i = 0; i < schedule.length; i++) {
            const entry = schedule[i];
            const year = Math.floor(entry.month / 12);
            
            if (!yearlyData[year]) {
                yearlyData[year] = {
                    principal_paid: 0,
                    interest_paid: 0,
                    total_paid: 0,
                    remaining_balance: entry.ending_balance
                };
            }
            
            yearlyData[year].principal_paid += entry.principal_payment;
            yearlyData[year].interest_paid += entry.interest_payment;
            yearlyData[year].total_paid += entry.monthly_payment;
            yearlyData[year].remaining_balance = entry.ending_balance;
        }
        
        return yearlyData;
    }

    // Create cumulative data for line charts
    function createCumulativeData(yearlyData) {
        const cumulativeData = {
            years: [],
            total_interest: [],
            total_paid: [],
            remaining_balance: []
        };
        
        let cumInterest = 0;
        let cumTotal = 0;
        
        Object.entries(yearlyData).forEach(([year, data]) => {
            cumInterest += data.interest_paid;
            cumTotal += data.total_paid;
            
            cumulativeData.years.push(parseInt(year));
            cumulativeData.total_interest.push(cumInterest);
            cumulativeData.total_paid.push(cumTotal);
            cumulativeData.remaining_balance.push(data.remaining_balance);
        });
        
        return cumulativeData;
    }

    // Update charts function
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
                        <div id="balanceChart" class="chart-container mt-4"></div>
                        <div id="totalInterestChart" class="chart-container mt-4"></div>
                        <div id="totalPaidChart" class="chart-container mt-4"></div>
                        <div id="yearSummaryTable" class="mt-4"></div>
                    </div>
                </div>
            </div>
        `;

        // Monthly Payments Comparison
        createMonthlyPaymentsChart(scenarios);

        // Create line chart data
        const lineChartData = {
            balance: [],
            totalInterest: [],
            totalPaid: []
        };

        scenarioNames.forEach(name => {
            const scenario = scenarios[name];
            const color = getScenarioColor(name);
            const yearlyData = createYearlyData(scenario);
            const cumulativeData = createCumulativeData(yearlyData);

            // Balance Over Time
            lineChartData.balance.push({
                x: cumulativeData.years,
                y: cumulativeData.remaining_balance,
                type: 'scatter',
                mode: 'lines',
                name: scenario.scenario_name,
                line: { color: color, width: 3 },
                hovertemplate: 'Year %{x}<br>Balance: $%{y:,.0f}<extra></extra>'
            });

            // Total Interest Over Time
            lineChartData.totalInterest.push({
                x: cumulativeData.years,
                y: cumulativeData.total_interest,
                type: 'scatter',
                mode: 'lines',
                fill: 'tonexty',
                name: scenario.scenario_name,
                line: { color: color, width: 3 },
                hovertemplate: 'Year %{x}<br>Total Interest: $%{y:,.0f}<extra></extra>'
            });

            // Total Money Paid Over Time
            lineChartData.totalPaid.push({
                x: cumulativeData.years,
                y: cumulativeData.total_paid,
                type: 'scatter',
                mode: 'lines',
                name: scenario.scenario_name,
                line: { color: color, width: 3 },
                hovertemplate: 'Year %{x}<br>Total Paid: $%{y:,.0f}<extra></extra>'
            });

            // Create year-by-year summary tables for all scenarios
            const summaryTable = document.getElementById('yearSummaryTable');
            const yearlyDataByScenario = {};
            const maxYears = Math.max(...scenarioNames.map(name => 
                Object.keys(createYearlyData(scenarios[name])).length
            ));
            
            // Collect yearly data for all scenarios
            scenarioNames.forEach(name => {
                yearlyDataByScenario[name] = createYearlyData(scenarios[name]);
            });

            // Create the table HTML
            summaryTable.innerHTML = `
                <h5 class="mb-3">Year-By-Year Summary Comparison</h5>
                <div class="sticky-table-container">
                    <table class="table table-striped table-hover sticky-table">
                        <thead>
                            <tr>
                                <th>Year</th>
                                ${scenarioNames.map(name => {
                                    const color = getScenarioColor(name);
                                    return `
                                    <th colspan="4" class="text-center" 
                                        style="border-left: 2px solid ${color}; 
                                               border-top: 2px solid ${color}; 
                                               border-right: 2px solid ${color};">
                                        <span style="color: ${color}">
                                            ${name}
                                        </span>
                                    </th>
                                `}).join('')}
                            </tr>
                            <tr>
                                <th></th>
                                ${scenarioNames.map(name => {
                                    const color = getScenarioColor(name);
                                    return `
                                    <th class="text-end" style="border-left: 2px solid ${color};">Principal</th>
                                    <th class="text-end">Interest</th>
                                    <th class="text-end">Total</th>
                                    <th class="text-end" style="border-right: 2px solid ${color};">Balance</th>
                                `}).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({length: maxYears}, (_, year) => `
                                <tr>
                                    <td>${year + 1}</td>
                                    ${scenarioNames.map(name => {
                                        const color = getScenarioColor(name);
                                        const data = yearlyDataByScenario[name][year] || {
                                            principal_paid: 0,
                                            interest_paid: 0,
                                            total_paid: 0,
                                            remaining_balance: 0
                                        };
                                        return `
                                            <td class="text-end" style="border-left: 2px solid ${color};">${formatCurrency(data.principal_paid)}</td>
                                            <td class="text-end">${formatCurrency(data.interest_paid)}</td>
                                            <td class="text-end">${formatCurrency(data.total_paid)}</td>
                                            <td class="text-end" style="border-right: 2px solid ${color};">${formatCurrency(data.remaining_balance)}</td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td></td>
                                ${scenarioNames.map(name => {
                                    const color = getScenarioColor(name);
                                    return `
                                    <th colspan="4" style="border-left: 2px solid ${color}; 
                                                         border-bottom: 2px solid ${color}; 
                                                         border-right: 2px solid ${color};"></th>
                                `}).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        });

        // Balance Over Time Chart
        const balanceLayout = {
            title: {
                text: 'Balance Over Time',
                y: 0.95
            },
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
                title: 'Year',
                automargin: true
            },
            margin: { t: 30, b: 80, l: 60, r: 40 }
        };

        // Total Interest Over Time Chart
        const totalInterestLayout = {
            title: {
                text: 'Total Interest Over Time',
                y: 0.95
            },
            showlegend: true,
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
                title: 'Year',
                automargin: true
            },
            margin: { t: 30, b: 80, l: 60, r: 40 }
        };

        // Total Money Paid Over Time Chart
        const totalPaidLayout = {
            title: {
                text: 'Total Money Paid Over Time',
                y: 0.9,
                font: { size: 14 }
            },
            showlegend: true,
            height:500,
            legend: {
                orientation: 'h',
                y: -0.2,
                x: 0.5,
                xanchor: 'center'
            },
            yaxis: {
                title: 'Total Paid ($)',
                automargin: true,
                tickformat: ',.0f'
            },
            xaxis: {
                title: 'Year',
                automargin: true
            },
            margin: { t: 10, b: 80, l: 60, r: 40 }
        };

        Plotly.newPlot('balanceChart', lineChartData.balance, balanceLayout);
        Plotly.newPlot('totalInterestChart', lineChartData.totalInterest, totalInterestLayout);
        Plotly.newPlot('totalPaidChart', lineChartData.totalPaid, totalPaidLayout);
    }

    // Update comparison table
    function updateComparisonTable(scenarios) {
        const table = document.getElementById('comparisonTable');
        const thead = table.querySelector('thead');
        thead.innerHTML = ''; // Clear existing headers
        
        // Create scenario name row
        const scenarioRow = document.createElement('tr');
        scenarioRow.innerHTML = `
            <th rowspan="2" style="vertical-align: bottom;">Metric</th>
            ${Object.keys(scenarios).map(name => `
                <th colspan="1" class="text-center">
                    <span style="color: ${getScenarioColor(name)}">${name}</span>
                </th>
            `).join('')}
        `;
        thead.appendChild(scenarioRow);
        
        // Create metrics row (now empty since we only need the cells for alignment)
        const metricsRow = document.createElement('tr');
        metricsRow.innerHTML = `
            ${Object.keys(scenarios).map(() => '<th></th>').join('')}
        `;
        thead.appendChild(metricsRow);
        
        const tbody = table.querySelector('tbody');
        
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
        
        // Clear and rebuild tbody
        tbody.innerHTML = metrics.map(metric => `
            <tr>
                <td>${metric.label}</td>
                ${Object.entries(scenarios).map(([name, scenario]) => {
                    const value = metric.key.split('.').reduce((obj, key) => obj?.[key], scenario);
                    return `<td class="text-end" style="color: ${getScenarioColor(name)}">
                        ${value !== null ? formatCurrency(value) : 'N/A'}
                    </td>`;
                }).join('')}
            </tr>
        `).join('');
    }

    // Delete scenario
    async function deleteScenario(scenarioName) {
        try {
            const response = await fetch(`/api/scenarios/${scenarioName}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Clear color mapping for the deleted scenario
            delete colorMap[scenarioName];
            
            // Reload scenarios to refresh the UI
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

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Generate scenario name based on form data
        const homePrice = parseInt(data.home_price).toLocaleString('en-US', { 
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        });
        const downPayment = parseInt(data.down_payment).toLocaleString('en-US', {
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        });
        
        let loanTypeStr = '';
        switch(data.loan_type) {
            case 'conventional':
                loanTypeStr = `Conventional, ${data.loan_term}yr`;
                break;
            case 'arm':
                loanTypeStr = `${data.initial_period}yr ARM`;
                break;
            case 'interest_only':
                loanTypeStr = `${data.interest_only_period}yr Interest Only`;
                break;
            case 'interest_only_hybrid':
                loanTypeStr = `${data.interest_only_period}yr Interest Only, ${data.loan_term}yr Conventional`;
                break;
        }
        
        // Format: "600k, 100k down|Conventional, 30yr"
        const scenarioName = `${homePrice}, ${downPayment} down|${loanTypeStr}`;
        
        // Format the data for the API
        const apiData = {
            scenario_name: scenarioName,
            home_price: parseFloat(data.home_price),
            down_payment: parseFloat(data.down_payment),
            interest_rate: parseFloat(data.interest_rate),
            loan_term: parseInt(data.loan_term),
            loan_type: data.loan_type,
            tax_bracket: data.tax_bracket ? parseFloat(data.tax_bracket) / 100 : null,  
            risk_free_rate: parseFloat(data.risk_free_rate) || null,
            property_tax_rate: parseFloat(data.property_tax_rate) || 1.1,
            insurance_cost: parseFloat(data.insurance_cost) || 1200,
            pmi_rate: parseFloat(data.pmi_rate) || 0.5
        };

        if (data.loan_type === 'arm') {
            apiData.arm_details = {
                initial_period: parseInt(data.initial_period),
                adjustment_frequency: 1,
                expected_rates: [apiData.interest_rate + 1] // Simple assumption for demo
            };
        }

        if (['interest_only', 'interest_only_hybrid'].includes(data.loan_type)) {
            apiData.interest_only_details = {
                interest_only_period: parseInt(data.interest_only_period),
                transition_rate: data.loan_type === 'interest_only_hybrid' ? 
                    parseFloat(data.transition_rate) : null
            };
        }
        
        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            form.reset();
            await loadScenarios();
            
        } catch (error) {
            console.error('Error saving scenario:', error);
            alert('Error saving scenario: ' + error.message);
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

    // Handle loan type changes
    document.querySelectorAll('input[name="loan_type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const armDetails = document.getElementById('armDetails');
            const interestOnlyDetails = document.getElementById('interestOnlyDetails');
            const transitionRateGroup = document.getElementById('transitionRateGroup');
            
            // Hide all special fields first
            armDetails.classList.add('d-none');
            interestOnlyDetails.classList.add('d-none');
            transitionRateGroup.classList.add('d-none');
            
            // Show relevant fields based on selection
            switch(this.value) {
                case 'arm':
                    armDetails.classList.remove('d-none');
                    break;
                case 'interest_only':
                    interestOnlyDetails.classList.remove('d-none');
                    break;
                case 'interest_only_hybrid':
                    interestOnlyDetails.classList.remove('d-none');
                    transitionRateGroup.classList.remove('d-none');
                    break;
            }
        });
    });

    // Initial load of scenarios
    loadScenarios();

    // Add scroll indicator to table containers
    function initializeScrollIndicators() {
        const tableContainers = document.querySelectorAll('.sticky-table-container');
        
        tableContainers.forEach(container => {
            // Add scroll indicator element
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.textContent = 'Scroll →';
            container.appendChild(indicator);

            // Check if container is scrollable
            function updateScrollableState() {
                const isScrollable = container.scrollWidth > container.clientWidth;
                container.classList.toggle('scrollable', isScrollable);
            }

            // Update on resize and content change
            window.addEventListener('resize', updateScrollableState);
            new MutationObserver(updateScrollableState).observe(container, {
                childList: true,
                subtree: true
            });

            // Initial check
            updateScrollableState();
        });
    }

    // Format table cell content for mobile
    function formatTableCell(value, type) {
        if (value === null || value === undefined) return 'N/A';
        
        switch(type) {
            case 'currency':
                return formatCurrency(value);
            case 'percent':
                return formatPercent(value);
            default:
                return value;
        }
    }

    // Create scenario comparison table with mobile optimizations
    function createComparisonTable(scenarios) {
        const table = document.createElement('div');
        table.className = 'sticky-table-container';
        
        // Generate table HTML with mobile-optimized content
        table.innerHTML = `
            <table class="table table-striped sticky-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        ${Object.keys(scenarios).map(name => `
                            <th class="text-center" style="color: ${getScenarioColor(name)}">
                                ${name.split('|').map(part => `<div>${part.trim()}</div>`).join('')}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${getMetricRows(scenarios)}
                </tbody>
            </table>
        `;

        // Initialize scroll indicator
        initializeScrollIndicators();
        
        return table;
    }

    // Helper function to generate metric rows
    function getMetricRows(scenarios) {
        const metrics = [
            { label: 'Monthly Payment (Interest Only Phase)', key: 'monthly_payment.interest_only', type: 'currency' },
            { label: 'Monthly Payment (Amortizing Phase)', key: 'monthly_payment.amortizing', type: 'currency' },
            { label: 'Average Monthly Payment', key: 'monthly_payment.overall', type: 'currency' },
            { label: 'Total Interest', key: 'total_interest', type: 'currency' },
            { label: 'Total Payments', key: 'total_payments', type: 'currency' },
            { label: 'Net Present Value (NPV)', key: 'npv', type: 'currency' },
            { label: 'Tax Savings', key: 'tax_savings', type: 'currency' },
            { label: 'Effective Cost', key: 'effective_cost', type: 'currency' }
        ];

        return metrics.map(metric => `
            <tr>
                <td>${metric.label}</td>
                ${Object.values(scenarios).map(scenario => `
                    <td>${formatTableCell(getNestedValue(scenario, metric.key), metric.type)}</td>
                `).join('')}
            </tr>
        `).join('');
    }

    // Helper function to safely get nested object values
    function getNestedValue(obj, path) {
        return path.split('.').reduce((curr, key) => 
            curr && curr[key] !== undefined ? curr[key] : null, obj);
    }
});
