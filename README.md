# Mortgage Scenario Explorer

A sophisticated web application for comparing different mortgage financing scenarios. This tool helps users analyze various loan types, including conventional, ARM (Adjustable Rate Mortgage), and interest-only hybrid loans, with advanced features like NPV calculations and tax implications.

## Features

- **Multiple Loan Types Support**:
  - Conventional Fixed-Rate Mortgages
  - Adjustable Rate Mortgages (ARM)
  - Interest-Only Loans
  - Interest-Only Hybrid Loans

- **Advanced Financial Calculations**:
  - Monthly Payment Breakdown
  - Total Interest and Principal Analysis
  - Net Present Value (NPV) Calculations
  - Tax Savings Estimates
  - Phase-Based Payment Analysis for Hybrid Loans

- **Scenario Comparison**:
  - Compare up to 3 different scenarios simultaneously
  - Visual comparison through interactive charts
  - Detailed comparison tables
  - Named scenarios for easy reference

## Project Structure

```
financing_scenarios/
├── app.py                 # Flask application main file
├── models/
│   ├── __init__.py
│   └── mortgage_calculator.py  # Core calculation logic
├── static/
│   ├── css/
│   │   └── style.css     # Custom styling
│   └── js/
│       └── main.js       # Frontend interaction logic
├── templates/
│   └── index.html        # Main application template
├── tests/
│   ├── __init__.py
│   └── test_mortgage_calculator.py  # Unit tests
└── requirements.txt      # Python dependencies
```

## Technical Stack

- **Backend**:
  - Python 3.12+
  - Flask web framework
  - NumPy for calculations
  - Pytest for testing

- **Frontend**:
  - Bootstrap 5.3.2 for responsive design
  - Plotly.js for interactive charts
  - Custom JavaScript for dynamic updates

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd financing_scenarios
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python app.py
   ```

5. Access the application at `http://127.0.0.1:5000`

## Usage

1. **Creating a Scenario**:
   - Enter basic loan details (home price, down payment, etc.)
   - Select loan type
   - Add tax bracket for tax implications
   - Specify risk-free rate for NPV calculations
   - Click "Add Scenario" to save

2. **Comparing Scenarios**:
   - Create up to 3 different scenarios
   - View side-by-side comparisons
   - Analyze payment differences
   - Compare total costs and NPV

3. **Analyzing Results**:
   - Review monthly payment breakdowns
   - Examine phase-specific payments for hybrid loans
   - Compare tax implications
   - Evaluate total costs and NPV

## Testing

Run the test suite using pytest:
```bash
python -m pytest tests/
```

The test suite covers:
- Basic mortgage calculations
- ARM rate adjustments
- Interest-only period handling
- NPV calculations
- Edge cases and error conditions

## Development

The application uses an in-memory storage system for scenarios, suitable for development and demonstration purposes. For production use, consider implementing a persistent storage solution.

### Key Components:

1. **MortgageCalculator Class**:
   - Handles all financial calculations
   - Supports multiple loan types
   - Provides detailed amortization schedules

2. **Flask Application**:
   - RESTful API endpoints for calculations
   - Scenario management
   - Static file serving

3. **Frontend**:
   - Dynamic form handling
   - Real-time updates
   - Interactive visualizations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

[Specify License]

## Contact

[Your Contact Information]
