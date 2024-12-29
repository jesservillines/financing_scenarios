import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Union

@dataclass
class ARMDetails:
    initial_period: int  # Years until first rate adjustment
    adjustment_frequency: int  # Years between rate adjustments
    expected_rates: List[float]  # Expected rates after initial period

class MortgageCalculator:
    def __init__(
        self,
        home_price: float,
        down_payment: float,
        interest_rate: float,
        loan_term: int,
        loan_type: str = 'conventional',
        arm_details: Optional[Dict] = None,
        extra_payments: Optional[Dict] = None,
        tax_bracket: Optional[float] = None
    ):
        self.home_price = home_price
        self.down_payment = down_payment
        self.loan_amount = home_price - down_payment
        self.interest_rate = interest_rate / 100  # Convert to decimal
        self.loan_term = loan_term
        self.loan_type = loan_type
        self.arm_details = ARMDetails(**arm_details) if arm_details else None
        self.extra_payments = extra_payments or {}
        self.tax_bracket = tax_bracket
        self.monthly_rate = self.interest_rate / 12
        self.total_payments = self.loan_term * 12

    def calculate_monthly_payment(self, principal: float, rate: float, remaining_months: int) -> float:
        """Calculate the monthly payment for a fixed-rate loan."""
        if remaining_months == 0:
            return 0
        monthly_rate = rate / 12
        return principal * (monthly_rate * (1 + monthly_rate)**remaining_months) / ((1 + monthly_rate)**remaining_months - 1)

    def calculate_arm_rates(self) -> List[float]:
        """Calculate monthly interest rates for ARM loans."""
        if not self.arm_details or self.loan_type != 'arm':
            return [self.monthly_rate] * self.total_payments

        monthly_rates = []
        current_rate = self.interest_rate
        
        # Initial period
        monthly_rates.extend([current_rate/12] * (self.arm_details.initial_period * 12))
        
        # Subsequent periods
        remaining_months = self.total_payments - len(monthly_rates)
        for expected_rate in self.arm_details.expected_rates:
            period_months = min(self.arm_details.adjustment_frequency * 12, remaining_months)
            monthly_rates.extend([expected_rate/100/12] * period_months)
            remaining_months -= period_months
            
        return monthly_rates

    def calculate(self) -> Dict:
        """Calculate complete amortization schedule and summary statistics."""
        monthly_rates = self.calculate_arm_rates()
        remaining_balance = self.loan_amount
        total_interest = 0
        amortization_schedule = []

        for month in range(self.total_payments):
            if remaining_balance <= 0:
                break

            rate = monthly_rates[month]
            interest_payment = remaining_balance * rate
            
            if self.loan_type == 'interest_only' and month < 60:  # First 5 years interest only
                principal_payment = 0
                monthly_payment = interest_payment
            else:
                monthly_payment = self.calculate_monthly_payment(
                    remaining_balance, rate * 12, self.total_payments - month
                )
                principal_payment = monthly_payment - interest_payment

            # Apply any extra payments
            extra_payment = self.extra_payments.get(str(month + 1), 0)
            principal_payment += extra_payment
            
            remaining_balance -= principal_payment
            total_interest += interest_payment

            amortization_schedule.append({
                'month': month + 1,
                'beginning_balance': remaining_balance + principal_payment,
                'monthly_payment': monthly_payment + extra_payment,
                'principal_payment': principal_payment,
                'interest_payment': interest_payment,
                'extra_payment': extra_payment,
                'ending_balance': remaining_balance
            })

        # Calculate tax implications if tax bracket is provided
        tax_savings = 0
        if self.tax_bracket:
            tax_savings = total_interest * (self.tax_bracket / 100)

        return {
            'monthly_payment': amortization_schedule[0]['monthly_payment'],
            'total_interest': total_interest,
            'total_payments': total_interest + self.loan_amount,
            'tax_savings': tax_savings,
            'effective_cost': total_interest - tax_savings,
            'amortization_schedule': amortization_schedule
        }
