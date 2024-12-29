import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Union

@dataclass
class ARMDetails:
    initial_period: int  # Years until first rate adjustment
    adjustment_frequency: int  # Years between rate adjustments
    expected_rates: List[float]  # Expected rates after initial period

@dataclass
class InterestOnlyDetails:
    interest_only_period: int  # Years of interest-only payments
    transition_rate: Optional[float] = None  # Interest rate after transition (if different)

class MortgageCalculator:
    def __init__(
        self,
        home_price: float,
        down_payment: float,
        interest_rate: float,
        loan_term: int,
        loan_type: str = 'conventional',
        arm_details: Optional[Dict] = None,
        interest_only_details: Optional[Dict] = None,
        extra_payments: Optional[Dict] = None,
        tax_bracket: Optional[float] = None,
        scenario_name: str = "Default Scenario",
        risk_free_rate: Optional[float] = None
    ):
        self.home_price = home_price
        self.down_payment = down_payment
        self.loan_amount = home_price - down_payment
        self.interest_rate = interest_rate / 100  # Convert to decimal
        self.loan_term = loan_term
        self.loan_type = loan_type
        self.arm_details = ARMDetails(**arm_details) if arm_details else None
        self.interest_only_details = InterestOnlyDetails(**interest_only_details) if interest_only_details else None
        self.extra_payments = extra_payments or {}
        self.tax_bracket = tax_bracket
        self.monthly_rate = self.interest_rate / 12
        self.total_payments = self.loan_term * 12
        self.scenario_name = scenario_name
        self.risk_free_rate = risk_free_rate / 100 if risk_free_rate is not None else None

    def calculate_monthly_payment(self, principal: float, rate: float, remaining_months: int, is_interest_only: bool = False) -> float:
        """Calculate the monthly payment for a loan."""
        if remaining_months == 0:
            return 0
        monthly_rate = rate / 12
        
        if is_interest_only:
            return principal * monthly_rate
            
        return principal * (monthly_rate * (1 + monthly_rate)**remaining_months) / ((1 + monthly_rate)**remaining_months - 1)

    def calculate_arm_rates(self) -> List[float]:
        """Calculate monthly interest rates for the entire loan term, accounting for ARM adjustments."""
        monthly_rates = []
        
        if not self.arm_details:
            # For non-ARM loans, use the same rate throughout
            return [self.monthly_rate] * self.total_payments
            
        initial_period_months = self.arm_details.initial_period * 12
        adjustment_freq_months = self.arm_details.adjustment_frequency * 12
        
        # Initial period
        monthly_rates.extend([self.monthly_rate] * initial_period_months)
        
        # Adjustment periods
        current_month = initial_period_months
        rate_index = 0
        
        while current_month < self.total_payments:
            if rate_index < len(self.arm_details.expected_rates):
                current_rate = self.arm_details.expected_rates[rate_index] / 100 / 12
            else:
                # If we run out of expected rates, use the last one
                current_rate = monthly_rates[-1]
            
            period_length = min(adjustment_freq_months, self.total_payments - current_month)
            monthly_rates.extend([current_rate] * period_length)
            
            current_month += period_length
            rate_index += 1
        
        return monthly_rates

    def calculate_npv(self, cash_flows: List[float]) -> float:
        """Calculate the present value of all monthly payments using the risk-free rate."""
        print(f"Debug - Risk Free Rate (annual): {self.risk_free_rate if self.risk_free_rate is not None else 'None'}")
        
        if self.risk_free_rate is None:
            total = sum(map(abs, cash_flows))
            print(f"Debug - No Risk Free Rate, returning sum: {total}")
            return total
        
        monthly_rf_rate = self.risk_free_rate / 12
        print(f"Debug - Monthly Risk Free Rate: {monthly_rf_rate}")
        
        npv = 0
        # Calculate present value of all monthly payments
        for i, cf in enumerate(cash_flows):
            abs_cf = abs(cf)
            discount_factor = (1 + monthly_rf_rate) ** (i + 1)
            pv = abs_cf / discount_factor
            npv += pv
            
            # Print debug info for first few and last few payments
            if i < 3 or i > len(cash_flows) - 4:
                print(f"Debug - Month {i+1}: Payment = {abs_cf:.2f}, Discount Factor = {discount_factor:.4f}, PV = {pv:.2f}")
        
        print(f"Debug - Final NPV: {npv:.2f}")
        print(f"Debug - Total Payments (non-discounted): {sum(map(abs, cash_flows)):.2f}")
        return npv

    def calculate(self) -> Dict:
        print(f"Debug - Starting calculation with risk-free rate: {self.risk_free_rate}")
        monthly_rates = self.calculate_arm_rates()
        remaining_balance = self.loan_amount
        total_interest = 0
        amortization_schedule = []
        cash_flows = []  # For NPV calculation
        
        # Handle edge case where loan amount is 0
        if remaining_balance <= 0:
            return {
                'scenario_name': self.scenario_name,
                'loan_details': {
                    'loan_type': self.loan_type,
                    'loan_amount': self.loan_amount,
                    'interest_rate': self.interest_rate * 100,
                    'loan_term': self.loan_term,
                    'interest_only_period': self.interest_only_details.interest_only_period if self.interest_only_details else None,
                    'risk_free_rate': self.risk_free_rate * 100 if self.risk_free_rate is not None else None
                },
                'monthly_payment': {
                    'interest_only': None,
                    'amortizing': None,
                    'overall': 0
                },
                'total_interest': 0,
                'total_payments': 0,
                'tax_savings': 0,
                'effective_cost': 0,
                'npv': 0,
                'amortization_schedule': []
            }
        
        interest_only_months = 0
        if self.loan_type in ['interest_only', 'interest_only_hybrid'] and self.interest_only_details:
            interest_only_months = self.interest_only_details.interest_only_period * 12

        # For hybrid loans, calculate the required payment to fully amortize the remaining balance
        if self.loan_type == 'interest_only_hybrid':
            remaining_term_months = self.total_payments - interest_only_months
            amortizing_rate = (self.interest_only_details.transition_rate / 100 / 12 
                             if self.interest_only_details.transition_rate 
                             else self.monthly_rate)
            amortizing_payment = self.calculate_monthly_payment(
                self.loan_amount,
                amortizing_rate * 12,
                remaining_term_months,
                is_interest_only=False
            )

        for month in range(self.total_payments):
            if remaining_balance <= 0:
                break

            rate = monthly_rates[month]
            
            # Handle transition from interest-only to amortizing for hybrid loans
            if self.loan_type == 'interest_only_hybrid' and month == interest_only_months:
                if self.interest_only_details and self.interest_only_details.transition_rate:
                    rate = self.interest_only_details.transition_rate / 100 / 12
                    monthly_rates[month:] = [rate] * (len(monthly_rates) - month)

            interest_payment = remaining_balance * rate
            
            is_interest_only = (self.loan_type == 'interest_only' or 
                              (self.loan_type == 'interest_only_hybrid' and month < interest_only_months))
            
            if is_interest_only:
                principal_payment = 0
                monthly_payment = interest_payment
            else:
                if self.loan_type == 'interest_only_hybrid':
                    monthly_payment = amortizing_payment
                else:
                    monthly_payment = self.calculate_monthly_payment(
                        remaining_balance,
                        rate * 12,
                        self.total_payments - month,
                        is_interest_only=False
                    )
                principal_payment = monthly_payment - interest_payment

            # Apply any extra payments
            extra_payment = self.extra_payments.get(str(month + 1), 0)
            principal_payment += extra_payment
            total_payment = monthly_payment + extra_payment
            
            remaining_balance -= principal_payment
            total_interest += interest_payment
            
            # Store cash flow for NPV calculation
            cash_flows.append(-total_payment)

            payment_phase = ('Interest Only' if is_interest_only else 
                           'Amortizing' if self.loan_type == 'interest_only_hybrid' 
                           else 'Principal + Interest')

            amortization_schedule.append({
                'month': month + 1,
                'beginning_balance': remaining_balance + principal_payment,
                'monthly_payment': monthly_payment + extra_payment,
                'principal_payment': principal_payment,
                'interest_payment': interest_payment,
                'extra_payment': extra_payment,
                'ending_balance': remaining_balance,
                'payment_phase': payment_phase,
                'interest_rate': rate * 12 * 100  # Convert to percentage
            })

        # Calculate tax implications if tax bracket is provided
        tax_savings = 0
        if self.tax_bracket:
            tax_savings = total_interest * (self.tax_bracket / 100)

        # Calculate NPV
        npv = self.calculate_npv(cash_flows)

        # Calculate average monthly payment for each phase
        interest_only_payments = [x['monthly_payment'] for x in amortization_schedule 
                                if x['payment_phase'] == 'Interest Only']
        amortizing_payments = [x['monthly_payment'] for x in amortization_schedule 
                             if x['payment_phase'] in ['Amortizing', 'Principal + Interest']]

        return {
            'scenario_name': self.scenario_name,
            'loan_details': {
                'loan_type': self.loan_type,
                'loan_amount': self.loan_amount,
                'interest_rate': self.interest_rate * 100,
                'loan_term': self.loan_term,
                'interest_only_period': self.interest_only_details.interest_only_period if self.interest_only_details else None,
                'risk_free_rate': self.risk_free_rate * 100 if self.risk_free_rate is not None else None
            },
            'monthly_payment': {
                'interest_only': sum(interest_only_payments) / len(interest_only_payments) if interest_only_payments else None,
                'amortizing': sum(amortizing_payments) / len(amortizing_payments) if amortizing_payments else None,
                'overall': sum([x['monthly_payment'] for x in amortization_schedule]) / len(amortization_schedule)
            },
            'total_interest': total_interest,
            'total_payments': total_interest + self.loan_amount,
            'tax_savings': tax_savings,
            'effective_cost': total_interest - tax_savings,
            'npv': npv,
            'amortization_schedule': amortization_schedule
        }
