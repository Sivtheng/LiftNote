#!/bin/bash

echo "🚀 Running LiftNote Performance Test"
echo "=================================="
echo "Test Scenario: 1 Coach + 5 Clients"
echo "Duration: ~5 minutes"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo "❌ JMeter not found. Install it first:"
    echo "   brew install jmeter"
    exit 1
fi

echo "✅ JMeter found: $(jmeter -v | head -n 1)"
echo ""

# Create results directory
mkdir -p results

# Run the test
echo "📊 Starting test..."
jmeter -n -t jmeter-test-plan.jmx -l results/test-results.jtl -e -o results/html-report

echo ""
echo "✅ Test completed!"
echo "📁 Results saved to: results/test-results.jtl"
echo "📊 HTML report: results/html-report/index.html"
echo ""
echo "📈 Quick Summary:"
echo "=================="

# Show basic stats
if [ -f "results/test-results.jtl" ]; then
    total_requests=$(awk -F',' 'NR>1 {count++} END {print count}' results/test-results.jtl)
    echo "Total Requests: $total_requests"
    
    # Calculate average response time
    avg_time=$(awk -F',' 'NR>1 {sum+=$1} END {print sum/NR}' results/test-results.jtl 2>/dev/null || echo "N/A")
    echo "Avg Response Time: ${avg_time}ms"
    
    # Calculate error rate
    error_rate=$(awk -F',' 'NR>1 {if($7=="false") errors++} END {print (errors/NR)*100}' results/test-results.jtl 2>/dev/null || echo "N/A")
    echo "Error Rate: ${error_rate}%"
fi

echo ""
echo "🎉 Open results/html-report/index.html for detailed analysis" 