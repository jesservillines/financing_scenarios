# Mortgage Financing Scenario Explorer

A web application for exploring different mortgage financing scenarios. Compare various loan types, interest rates, and payment structures to make informed mortgage decisions.

## Features

- Dynamic mortgage calculations for different loan types:
  - Conventional fixed-rate mortgages
  - Adjustable-rate mortgages (ARMs)
  - Interest-only loans
  - Interest-only then amortizing loans
- Scenario comparison with visual analytics
- Detailed payment breakdowns
- Tax consideration calculations
- Monthly payment and total cost analysis

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Project Structure

- `/app`: Main application directory
  - `/static`: CSS, JavaScript, and other static files
  - `/templates`: HTML templates
  - `/models`: Calculation models and business logic
- `app.py`: Main Flask application
- `requirements.txt`: Python dependencies
