from flask import Flask, render_template, request, jsonify, send_from_directory
from models.mortgage_calculator import MortgageCalculator
from collections import OrderedDict
import os

app = Flask(__name__, static_url_path='/static')
# Store scenarios in memory (for development purposes)
scenarios = OrderedDict()

@app.route('/')
def index():
    if 'scenarios' not in locals():
        scenarios = OrderedDict()
    return render_template('index.html', scenarios=scenarios)

# Explicit route for static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

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
        interest_only_details=data.get('interest_only_details'),
        extra_payments=data.get('extra_payments'),
        tax_bracket=data.get('tax_bracket'),
        scenario_name=data.get('scenario_name', 'Unnamed Scenario')
    )
    result = calculator.calculate()
    
    # Store scenario in memory
    scenario_name = data.get('scenario_name', 'Unnamed Scenario')
    scenarios[scenario_name] = result
    
    # Keep only the last 3 scenarios
    while len(scenarios) > 3:
        scenarios.popitem(last=False)
    
    return jsonify(result)

@app.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    return jsonify(scenarios)

@app.route('/api/scenarios/<scenario_name>', methods=['DELETE'])
def delete_scenario(scenario_name):
    if scenario_name in scenarios:
        del scenarios[scenario_name]
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
