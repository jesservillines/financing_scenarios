# Financing Scenarios Comparison Tool

A sophisticated web application for comparing different mortgage financing scenarios, helping users make informed decisions about their real estate investments.

## Features

### Scenario Management
- Create and compare multiple financing scenarios
- Automatic scenario naming based on key parameters
- Support for various loan types:
  - Conventional
  - Interest Only
  - Interest Only Hybrid
  - Adjustable Rate Mortgage (ARM)

### Financial Calculations
- Monthly payment calculations for different loan phases
- Total interest and payment calculations
- Net Present Value (NPV) analysis
- Tax savings calculations with configurable tax bracket
- Effective cost analysis considering tax benefits

### Visualization
- Interactive charts for monthly payment comparison
- Total cost analysis visualization
- Mobile-responsive design
- Color-coded scenarios for easy comparison

### User Interface
- Intuitive form for scenario creation
- Responsive design for all device sizes
- Sticky tables with horizontal scrolling on mobile
- Visual indicators for better mobile navigation
- Modern, clean aesthetic with Bootstrap styling

## Technical Details

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap for responsive layout
- Chart.js and Plotly.js for data visualization
- Custom mobile optimizations for tables and charts

### Backend
- Python with Flask framework
- RESTful API design
- JSON-based data storage
- Modular architecture for easy maintenance

### Testing
- Jest for JavaScript unit testing
- Mobile responsiveness testing suite
- Comprehensive test coverage for UI components

## Current State (as of December 2024)

### Recently Implemented Features
1. Mobile Optimization
   - Enhanced table responsiveness
   - Improved chart containers
   - Better touch targets
   - Scroll indicators for tables

2. Financial Calculations
   - Tax bracket integration (default: 32%)
   - Risk-free rate configuration (default: 4.64%)
   - Comprehensive payment calculations

3. UI Improvements
   - Color-coded scenarios
   - Improved data visualization
   - Better mobile layout
   - Enhanced table readability

### Planned Improvements
1. Additional Features
   - More loan type options
   - Custom amortization schedules
   - Export functionality for scenarios
   - Comparison history

2. Technical Enhancements
   - Additional unit tests
   - Performance optimizations
   - Enhanced mobile experience
   - Offline capability

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/financing_scenarios.git
```

2. Install dependencies
```bash
pip install -r requirements.txt
npm install  # for testing dependencies
```

3. Run the application
```bash
python app.py
```

4. Run tests
```bash
npm test
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any enhancements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
