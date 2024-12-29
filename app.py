from flask import Flask, render_template, request, jsonify
from models.mortgage_calculator import MortgageCalculator

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    calculator = MortgageCalculator(
        home_price=data.get('home_price'),
        down_payment=data.get('down_payment'),
        interest_rate=data.get('interest_rate'),
        loan_term=data.get('loan_term'),
        loan_type=data.get('loan_type'),
        arm_details=data.get('arm_details'),
        extra_payments=data.get('extra_payments'),
        tax_bracket=data.get('tax_bracket')
    )
    return jsonify(calculator.calculate())

if __name__ == '__main__':
    app.run(debug=True)
