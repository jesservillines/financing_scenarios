document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mortgageForm');
    const loanTypeInputs = document.getElementsByName('loanType');
    const armDetails = document.getElementById('armDetails');

    // Show/hide ARM details based on loan type selection
    loanTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            armDetails.classList.toggle('d-none', this.value !== 'arm');
        });
    });

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Update loan amount when home price or down payment changes
    function updateLoanAmount() {
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        const loanAmount = homePrice - downPayment;
        // You could display this somewhere if desired
    }

    // Create charts
    function createCharts(data) {
        // Pie chart for Principal vs Interest
        const pieData = [{
            values: [data.total_payments - data.total_interest, data.total_interest],
            labels: ['Principal', 'Interest'],
            type: 'pie'
        }];
        
        Plotly.newPlot('pieChart', pieData, {
            height: 300,
            margin: { t: 0, b: 0, l: 0, r: 0 }
        });

        // Line chart for Balance Over Time
        const balances = data.amortization_schedule.map(row => row.ending_balance);
        const months = data.amortization_schedule.map(row => row.month);
        
        const lineData = [{
            x: months,
            y: balances,
            type: 'scatter',
            mode: 'lines',
            name: 'Remaining Balance'
        }];

        Plotly.newPlot('lineChart', lineData, {
            height: 300,
            margin: { t: 0, b: 40, l: 60, r: 0 },
            xaxis: { title: 'Month' },
            yaxis: { title: 'Balance ($)' }
        });
    }

    // Update amortization table
    function updateAmortizationTable(schedule) {
        const tbody = document.querySelector('#amortizationTable tbody');
        tbody.innerHTML = '';
        
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>${formatCurrency(row.monthly_payment)}</td>
                <td>${formatCurrency(row.principal_payment)}</td>
                <td>${formatCurrency(row.interest_payment)}</td>
                <td>${formatCurrency(row.ending_balance)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            home_price: parseFloat(document.getElementById('homePrice').value),
            down_payment: parseFloat(document.getElementById('downPayment').value),
            interest_rate: parseFloat(document.getElementById('interestRate').value),
            loan_term: parseInt(document.getElementById('loanTerm').value),
            loan_type: document.querySelector('input[name="loanType"]:checked').value,
            tax_bracket: parseFloat(document.getElementById('taxBracket').value) || null
        };

        if (formData.loan_type === 'arm') {
            formData.arm_details = {
                initial_period: parseInt(document.getElementById('armPeriod').value),
                adjustment_frequency: 1,
                expected_rates: [formData.interest_rate + 1] // Simple assumption for demo
            };
        }

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            // Update summary information
            document.getElementById('monthlyPayment').textContent = formatCurrency(data.monthly_payment);
            document.getElementById('totalInterest').textContent = formatCurrency(data.total_interest);
            document.getElementById('totalCost').textContent = formatCurrency(data.total_payments);

            // Update visualizations
            createCharts(data);
            updateAmortizationTable(data.amortization_schedule);

        } catch (error) {
            console.error('Error calculating mortgage:', error);
            alert('Error calculating mortgage. Please try again.');
        }
    });

    // Add event listeners for home price and down payment
    document.getElementById('homePrice').addEventListener('input', updateLoanAmount);
    document.getElementById('downPayment').addEventListener('input', updateLoanAmount);
});
