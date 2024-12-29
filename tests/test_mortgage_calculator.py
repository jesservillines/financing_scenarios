import pytest
from models.mortgage_calculator import MortgageCalculator
import math

def test_npv_calculation():
    """Test NPV calculation with known values"""
    # Test case 1: Simple NPV with 5% annual rate
    calculator = MortgageCalculator(
        home_price=100000,
        down_payment=20000,
        interest_rate=5.0,
        loan_term=30,
        risk_free_rate=5.0
    )
    
    # Test with simple cash flows
    cash_flows = [-1000] * 12  # $1000 monthly payment for 1 year
    npv = calculator.calculate_npv(cash_flows)
    
    # Calculate expected NPV manually
    monthly_rate = 0.05 / 12
    expected_npv = sum(-1000 / ((1 + monthly_rate) ** i) for i in range(12))
    
    assert math.isclose(npv, expected_npv, rel_tol=1e-9)

def test_conventional_loan():
    """Test conventional loan calculations"""
    calculator = MortgageCalculator(
        home_price=300000,
        down_payment=60000,
        interest_rate=6.0,
        loan_term=30
    )
    
    result = calculator.calculate()
    
    # Test loan amount
    assert result['loan_details']['loan_amount'] == 240000
    
    # Test monthly payment (using standard amortization formula)
    r = 0.06 / 12  # monthly rate
    n = 30 * 12    # total number of payments
    expected_payment = 240000 * (r * (1 + r)**n) / ((1 + r)**n - 1)
    assert math.isclose(result['monthly_payment']['overall'], expected_payment, rel_tol=1e-9)
    
    # Test that final balance is approximately zero
    final_balance = result['amortization_schedule'][-1]['ending_balance']
    assert math.isclose(final_balance, 0, abs_tol=0.01)

def test_interest_only_hybrid():
    """Test interest-only hybrid loan calculations"""
    calculator = MortgageCalculator(
        home_price=400000,
        down_payment=80000,
        interest_rate=5.0,
        loan_term=30,
        loan_type='interest_only_hybrid',
        interest_only_details={
            'interest_only_period': 10,
            'transition_rate': 6.0
        }
    )
    
    result = calculator.calculate()
    
    # Test interest-only phase
    io_payment = result['monthly_payment']['interest_only']
    expected_io_payment = 320000 * 0.05 / 12
    assert math.isclose(io_payment, expected_io_payment, rel_tol=1e-9)
    
    # Test amortizing phase
    amort_payment = result['monthly_payment']['amortizing']
    r = 0.06 / 12  # monthly rate after transition
    n = 20 * 12    # remaining payments
    expected_amort_payment = 320000 * (r * (1 + r)**n) / ((1 + r)**n - 1)
    assert math.isclose(amort_payment, expected_amort_payment, rel_tol=1e-9)
    
    # Test final balance
    final_balance = result['amortization_schedule'][-1]['ending_balance']
    assert math.isclose(final_balance, 0, abs_tol=0.01)

def test_arm_loan():
    """Test ARM loan calculations"""
    calculator = MortgageCalculator(
        home_price=350000,
        down_payment=70000,
        interest_rate=4.5,
        loan_term=30,
        loan_type='arm',
        arm_details={
            'initial_period': 5,
            'adjustment_frequency': 1,
            'expected_rates': [5.5, 6.0, 6.5]
        }
    )
    
    result = calculator.calculate()
    
    # Test initial rate period
    initial_rate = result['amortization_schedule'][0]['interest_rate']
    assert math.isclose(initial_rate, 4.5, rel_tol=1e-9)
    
    # Test rate adjustment
    adjusted_rate = result['amortization_schedule'][5*12]['interest_rate']
    assert math.isclose(adjusted_rate, 5.5, rel_tol=1e-9)
    
    # Test final balance
    final_balance = result['amortization_schedule'][-1]['ending_balance']
    assert math.isclose(final_balance, 0, abs_tol=0.01)

def test_npv_with_different_rates():
    """Test NPV calculations with different risk-free rates"""
    loan_amount = 200000
    monthly_payment = 1200
    
    # Test with different risk-free rates
    rates = [3.0, 5.0, 7.0]
    npvs = []
    
    for rate in rates:
        calculator = MortgageCalculator(
            home_price=250000,
            down_payment=50000,
            interest_rate=6.0,
            loan_term=30,
            risk_free_rate=rate
        )
        
        # Create cash flows with negative values (payments)
        cash_flows = [-monthly_payment] * (30 * 12)
        npv = calculator.calculate_npv(cash_flows)
        npvs.append(-npv)  # Convert to positive for comparison
    
    # NPV should decrease as risk-free rate increases
    assert npvs[0] > npvs[1] > npvs[2]

def test_tax_savings():
    """Test tax savings calculations"""
    calculator = MortgageCalculator(
        home_price=300000,
        down_payment=60000,
        interest_rate=6.0,
        loan_term=30,
        tax_bracket=25.0
    )
    
    result = calculator.calculate()
    
    # Test tax savings calculation
    expected_tax_savings = result['total_interest'] * 0.25
    assert math.isclose(result['tax_savings'], expected_tax_savings, rel_tol=1e-9)

def test_edge_cases():
    """Test edge cases and potential error conditions"""
    
    # Test with 100% down payment
    calculator = MortgageCalculator(
        home_price=100000,
        down_payment=100000,
        interest_rate=5.0,
        loan_term=30
    )
    result = calculator.calculate()
    assert result['monthly_payment']['overall'] == 0
    
    # Test with very high interest rate
    calculator = MortgageCalculator(
        home_price=100000,
        down_payment=20000,
        interest_rate=50.0,
        loan_term=30
    )
    result = calculator.calculate()
    assert result['monthly_payment']['overall'] > 0
    
    # Test with very short loan term
    calculator = MortgageCalculator(
        home_price=100000,
        down_payment=20000,
        interest_rate=5.0,
        loan_term=1
    )
    result = calculator.calculate()
    assert len(result['amortization_schedule']) == 12
