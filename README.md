# Financing Scenarios Comparison Tool

A sophisticated web application for comparing different mortgage financing scenarios, helping users make informed decisions about their real estate investments.

🔗 **Live Application**: [https://financing-scenarios.onrender.com/](https://financing-scenarios.onrender.com/)

## Overview

This tool helps you compare different mortgage financing options side by side, calculating key metrics like monthly payments, total interest, tax savings, and more. Perfect for real estate investors, homebuyers, or anyone looking to understand the long-term implications of different mortgage options.

## Loan Types Explained

### 1. Conventional Loan
- Traditional fixed-rate mortgage
- Consistent monthly payments throughout the loan term
- Available in 10, 15, and 30-year terms
- Best for: Buyers who want predictable payments and plan to stay in the home long-term

### 2. Adjustable Rate Mortgage (ARM)
- Initial fixed-rate period followed by adjustable rates
- Options available:
  - 5/1 ARM: Fixed for 5 years, then adjusts annually
  - 7/1 ARM: Fixed for 7 years, then adjusts annually
  - 10/1 ARM: Fixed for 10 years, then adjusts annually
- Best for: Buyers who plan to sell or refinance before the rate adjusts

### 3. Interest Only
- Pay only interest for a specified period
- Full principal and interest payments begin after the interest-only period
- Customizable interest-only period (typically 5-10 years)
- Best for: Investors prioritizing cash flow or expecting property appreciation

### 4. Interest Only Hybrid
- Combines interest-only period with a different rate after the initial period
- Allows specification of the transition interest rate
- Fully amortizing payments after the interest-only period
- Best for: Sophisticated investors with specific cash flow strategies

## Customizable Parameters

### Basic Loan Parameters
- **Home Price**: The total purchase price of the property
- **Down Payment**: Amount paid upfront (affects loan-to-value ratio and PMI)
- **Interest Rate**: Annual interest rate (as a percentage)
- **Loan Term**: 10, 15, or 30 years

### Additional Costs
- **Property Tax Rate**: Annual property tax as a percentage of home value (default: 1.1%)
- **Annual Insurance Cost**: Yearly homeowner's insurance premium (default: $1,200)
- **PMI Rate**: Private Mortgage Insurance rate for down payments < 20% (default: 0.5%)

### Tax and Investment Parameters
- **Tax Bracket**: Your marginal tax rate for deduction calculations (default: 32%)
- **Risk-Free Rate**: Used for NPV calculations (default: 4.64%, based on 10-year Treasury)

## Features

### Scenario Management
- Create and compare up to 3 different scenarios simultaneously
- Auto-generated scenario names based on key parameters
- Easy deletion and modification of scenarios

### Financial Analysis
- Monthly payment breakdown for different loan phases
- Total interest paid over the loan term
- Net Present Value (NPV) analysis
- Tax savings calculations
- Effective cost after tax benefits

### Visualization
- Interactive charts showing:
  - Monthly payment comparisons
  - Total interest paid
  - Balance over time
- Color-coded scenarios for easy comparison

### Mobile-Optimized
- Responsive design works on all devices
- Touch-friendly interface
- Optimized tables with horizontal scrolling
- Visual scroll indicators

## How to Use

1. **Enter Basic Information**
   - Input home price and down payment
   - Select loan type and term
   - Enter interest rate

2. **Customize Additional Parameters**
   - Adjust property tax rate if different from default
   - Modify insurance costs if needed
   - Set your tax bracket for accurate tax benefit calculations

3. **Add Scenarios**
   - Click "Add Scenario" to save your first scenario
   - Modify parameters and add more scenarios to compare
   - View automatically generated charts and comparisons

4. **Analyze Results**
   - Compare monthly payments across scenarios
   - Review total interest paid
   - Consider tax implications
   - Evaluate long-term costs and benefits

## Technical Details

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap for responsive layout
- Chart.js and Plotly.js for data visualization

### Backend
- Python with Flask framework
- RESTful API design
- JSON-based data storage

## Getting Started

1. Visit [https://financing-scenarios.onrender.com/](https://financing-scenarios.onrender.com/)
2. Start creating scenarios
3. Compare and analyze different financing options

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/financing_scenarios.git
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Run locally
```bash
python app.py
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

Contact the Author, Jesse Villines: [LinkedIn Profile](https://www.linkedin.com/in/jesse-villines/)
