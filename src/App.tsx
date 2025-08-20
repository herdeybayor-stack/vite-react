import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

const ReviveCapitalCalculator = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [inputs, setInputs] = useState({
    // Core Project Parameters
    projectName: 'Revive Capital Project 1',
    renovationCost: 8000000,
    numberOfUnits: 4,
    projectedAnnualRentPerUnit: 700000,
    agreementFeePerUnit: 300000,
    operatingExpensesMonthly: 50000,
    operatingExpensesPercent: 10,
    managementFee: 10,
    vacancyRate: 8,
    maintenanceReserve: 5,
    projectDurationMonths: 6,
    majorMaintenanceYear: 8,
    majorMaintenanceCost: 700000,
    
    // Advanced Parameters
    rentIncreaseRate: 5,
    rentIncreaseFrequency: 2,
    landlordPaymentTier1Years: 3,
    landlordPaymentTier1Percent: 15,
    landlordPaymentTier2Years: 5,
    landlordPaymentTier2Percent: 25,
    landlordPaymentTier3Percent: 35,
    projectionYears: 12,
    discountRate: 10,
    
    // Sensitivity Analysis
    rentSensitivity: 0,
    vacancySensitivity: 0,
    costSensitivity: 0,
    delaySensitivity: 0
  });

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateIRR = (cashFlows) => {
    const maxIterations = 1000;
    const precision = 0.0001;
    let rate = 0.1;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;
      
      for (let j = 0; j < cashFlows.length; j++) {
        const discountFactor = Math.pow(1 + rate, j);
        npv += cashFlows[j] / discountFactor;
        
        if (j > 0) {
          derivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
        }
      }
      
      if (Math.abs(npv) < precision) {
        return rate * 100;
      }
      
      if (Math.abs(derivative) < precision) break;
      
      const newRate = rate - npv / derivative;
      
      if (newRate < -0.99) rate = -0.99;
      else if (newRate > 5) rate = 5;
      else rate = newRate;
    }
    
    return rate * 100;
  };

  const calculateNPV = (cashFlows, discountRate) => {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + discountRate / 100, i);
    }
    return npv;
  };

  const basicCalculations = useMemo(() => {
    const totalInvestment = inputs.renovationCost;
    const totalProjectedAnnualRent = inputs.projectedAnnualRentPerUnit * inputs.numberOfUnits;
    const totalAgreementFees = inputs.agreementFeePerUnit * inputs.numberOfUnits;
    
    const effectiveAnnualRent = totalProjectedAnnualRent * (1 - inputs.vacancyRate / 100);
    const annualOperatingExpenses = inputs.operatingExpensesPercent > 0 
      ? totalProjectedAnnualRent * (inputs.operatingExpensesPercent / 100)
      : inputs.operatingExpensesMonthly * 12;
    const annualManagementFees = totalProjectedAnnualRent * (inputs.managementFee / 100);
    const annualMaintenanceReserve = totalProjectedAnnualRent * (inputs.maintenanceReserve / 100);
    
    const annualNetIncome = effectiveAnnualRent - annualOperatingExpenses - annualManagementFees - annualMaintenanceReserve;
    const monthlyNetIncome = annualNetIncome / 12;
    
    const firstYearTotalReturn = annualNetIncome + totalAgreementFees;
    const paybackWithAgreementFees = totalInvestment / firstYearTotalReturn;
    
    const firstYearROI = (firstYearTotalReturn / totalInvestment) * 100;
    const sustainedROI = (annualNetIncome / totalInvestment) * 100;
    
    const projectionYears = Math.max(Math.ceil(paybackWithAgreementFees) + 2, 5);
    const cashFlowProjection = [];
    let cumulativeReturn = 0;
    
    for (let year = 1; year <= projectionYears; year++) {
      let yearlyIncome = 0;
      
      if (year === 1) {
        const rentingMonths = 12 - inputs.projectDurationMonths;
        yearlyIncome = (annualNetIncome * (rentingMonths / 12)) + totalAgreementFees;
      } else {
        yearlyIncome = annualNetIncome;
      }
      
      cumulativeReturn += yearlyIncome;
      const netROI = ((cumulativeReturn - totalInvestment) / totalInvestment) * 100;
      
      cashFlowProjection.push({
        year,
        annualCashFlow: yearlyIncome,
        cumulativeReturn,
        netROI: netROI,
        investmentRecovered: Math.min(100, (cumulativeReturn / totalInvestment) * 100),
        breakEven: cumulativeReturn >= totalInvestment
      });
    }

    return {
      totalInvestment,
      monthlyNetIncome,
      annualNetIncome,
      totalProjectedAnnualRent,
      totalAgreementFees,
      paybackWithAgreementFees,
      firstYearROI,
      sustainedROI,
      firstYearTotalReturn,
      cashFlowProjection,
      effectiveAnnualRent,
      annualOperatingExpenses,
      annualManagementFees
    };
  }, [inputs]);

  const advancedCalculations = useMemo(() => {
    const totalInvestment = inputs.renovationCost * (1 + inputs.costSensitivity / 100);
    const baseAnnualRent = (inputs.projectedAnnualRentPerUnit * inputs.numberOfUnits) * (1 + inputs.rentSensitivity / 100);
    const totalAgreementFees = inputs.agreementFeePerUnit * inputs.numberOfUnits;
    const annualOperatingExpenses = inputs.operatingExpensesPercent > 0 
      ? baseAnnualRent * (inputs.operatingExpensesPercent / 100)
      : inputs.operatingExpensesMonthly * 12;
    
    const projectionData = [];
    const cashFlows = [-totalInvestment];
    let cumulativeInvestorReturn = 0;
    let cumulativeLandlordPayment = 0;
    let paybackYear = 0;
    let paybackFound = false;
    
    // Calculate vacancy loss and delay impact
    const vacancyLoss = (inputs.vacancySensitivity / 12) * baseAnnualRent;
    const delayImpact = (inputs.delaySensitivity / 12) * baseAnnualRent;
    
    for (let year = 1; year <= inputs.projectionYears; year++) {
      // Calculate rent with escalations
      const rentIncreaseCount = Math.floor((year - 1) / inputs.rentIncreaseFrequency);
      const currentAnnualRent = baseAnnualRent * Math.pow(1 + inputs.rentIncreaseRate / 100, rentIncreaseCount);
      
      // Apply vacancy rate
      const effectiveRent = currentAnnualRent * (1 - inputs.vacancyRate / 100);
      
      // Calculate expenses
      const managementFees = currentAnnualRent * (inputs.managementFee / 100);
      const maintenanceReserve = currentAnnualRent * (inputs.maintenanceReserve / 100);
      const majorMaintenance = year === inputs.majorMaintenanceYear ? inputs.majorMaintenanceCost : 0;
      
      // Net operating income before landlord payments
      let netOperatingIncome = effectiveRent - annualOperatingExpenses - managementFees - maintenanceReserve - majorMaintenance;
      
      // Apply sensitivity adjustments
      if (year === 1) {
        netOperatingIncome -= vacancyLoss + delayImpact;
      }
      
      // Determine landlord payment percentage
      let landlordPaymentPercent = 0;
      if (year <= inputs.landlordPaymentTier1Years) {
        landlordPaymentPercent = inputs.landlordPaymentTier1Percent;
      } else if (year <= inputs.landlordPaymentTier1Years + inputs.landlordPaymentTier2Years) {
        landlordPaymentPercent = inputs.landlordPaymentTier2Percent;
      } else {
        landlordPaymentPercent = inputs.landlordPaymentTier3Percent;
      }
      
      // Calculate landlord payment and investor net income
      const landlordPayment = netOperatingIncome * (landlordPaymentPercent / 100);
      let investorNetIncome = netOperatingIncome - landlordPayment;
      
      // Add agreement fees in first year
      if (year === 1) {
        const rentingMonths = 12 - inputs.projectDurationMonths - inputs.delaySensitivity;
        investorNetIncome = (investorNetIncome * Math.max(0, rentingMonths) / 12) + totalAgreementFees;
      }
      
      cumulativeInvestorReturn += investorNetIncome;
      cumulativeLandlordPayment += landlordPayment;
      cashFlows.push(investorNetIncome);
      
      // Calculate payback period
      if (!paybackFound && cumulativeInvestorReturn >= totalInvestment) {
        if (year === 1) {
          paybackYear = 1.0;
        } else {
          const previousCumulative = cumulativeInvestorReturn - investorNetIncome;
          const remainingAmount = totalInvestment - previousCumulative;
          const fractionOfYear = remainingAmount / investorNetIncome;
          paybackYear = (year - 1) + fractionOfYear;
        }
        paybackFound = true;
      }
      
      // Calculate metrics
      const annualROI = (investorNetIncome / totalInvestment) * 100;
      const cumulativeROI = ((cumulativeInvestorReturn - totalInvestment) / totalInvestment) * 100;
      const investmentRecovered = Math.min(100, (cumulativeInvestorReturn / totalInvestment) * 100);
      
      projectionData.push({
        year,
        currentAnnualRent,
        effectiveRent,
        netOperatingIncome: netOperatingIncome + landlordPayment, // Before landlord split
        landlordPaymentPercent,
        landlordPayment,
        investorNetIncome,
        cumulativeInvestorReturn,
        cumulativeLandlordPayment,
        annualROI,
        cumulativeROI,
        investmentRecovered,
        breakEven: cumulativeInvestorReturn >= totalInvestment
      });
    }
    
    // If payback never achieved
    if (!paybackFound) {
      paybackYear = totalInvestment / (cumulativeInvestorReturn / inputs.projectionYears);
    }
    
    // Calculate financial metrics
    const totalInvestorReturns = cumulativeInvestorReturn;
    const totalLandlordPayments = cumulativeLandlordPayment;
    const totalROI = ((totalInvestorReturns - totalInvestment) / totalInvestment) * 100;
    const annualizedROI = (Math.pow(totalInvestorReturns / totalInvestment, 1 / inputs.projectionYears) - 1) * 100;
    const irr = calculateIRR(cashFlows);
    const npv = calculateNPV(cashFlows, inputs.discountRate);
    
    return {
      projectionData,
      paybackPeriod: paybackYear,
      totalInvestorReturns,
      totalLandlordPayments,
      totalROI,
      annualizedROI,
      irr,
      npv,
      totalInvestment,
      cashFlows
    };
  }, [inputs]);

  const sensitivityAnalysis = useMemo(() => {
    const scenarios = [
      { name: 'Bear Case', rentMult: 0.85, costMult: 1.2, vacancyRate: 15, delay: 3 },
      { name: 'Base Case', rentMult: 1.0, costMult: 1.0, vacancyRate: inputs.vacancyRate, delay: 0 },
      { name: 'Bull Case', rentMult: 1.15, costMult: 0.9, vacancyRate: 5, delay: 0 }
    ];

    return scenarios.map(scenario => {
      const investment = inputs.renovationCost * scenario.costMult;
      const annualRent = inputs.projectedAnnualRentPerUnit * inputs.numberOfUnits * scenario.rentMult;
      const effectiveRent = annualRent * (1 - scenario.vacancyRate / 100);
      const operatingExpenses = inputs.operatingExpensesPercent > 0 
        ? annualRent * (inputs.operatingExpensesPercent / 100)
        : inputs.operatingExpensesMonthly * 12;
      const netIncome = effectiveRent - operatingExpenses - (annualRent * inputs.managementFee / 100) - (annualRent * inputs.maintenanceReserve / 100);
      const firstYearReturn = netIncome + (inputs.agreementFeePerUnit * inputs.numberOfUnits);
      const payback = investment / firstYearReturn;
      const firstYearROI = (firstYearReturn / investment) * 100;
      const sustainedROI = (netIncome / investment) * 100;

      return {
        scenario: scenario.name,
        paybackYears: payback,
        firstYearROI: firstYearROI,
        sustainedROI: sustainedROI,
        investment: investment,
        firstYearReturn: firstYearReturn
      };
    });
  }, [inputs]);

  const getRiskAssessment = () => {
    const adj = advancedCalculations;
    if (adj.totalROI < 50 || adj.paybackPeriod > 7) {
      return { level: 'HIGH', color: '#e74c3c', impact: 'SEVERE' };
    } else if (adj.totalROI < 75 || adj.paybackPeriod > 5) {
      return { level: 'MEDIUM', color: '#f39c12', impact: 'MODERATE' };
    } else {
      return { level: 'LOW', color: '#27ae60', impact: 'MINIMAL' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(Math.round(amount));
  };

  const TabButton = ({ tabName, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(tabName)}
      className={`px-6 py-3 font-medium rounded-t-lg transition-all duration-300 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:transform hover:-translate-y-0.5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Revive Capital Investment Calculator</h1>
          <p className="text-blue-100 text-lg">Comprehensive ROI, PBP, IRR & NPV Analysis for Property Renovation Investments</p>
          <p className="text-blue-200 text-sm mt-2">Nigerian Real Estate Market</p>
        </div>

        <div className="p-8">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-8 border-b border-gray-200">
            <TabButton 
              tabName="basic" 
              label="Basic Analysis" 
              isActive={activeTab === 'basic'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              tabName="advanced" 
              label="Advanced with Landlord Tiers" 
              isActive={activeTab === 'advanced'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              tabName="sensitivity" 
              label="Sensitivity & Risk Analysis" 
              isActive={activeTab === 'sensitivity'} 
              onClick={setActiveTab} 
            />
          </div>

          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Input Section */}
              <div className="lg:col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Project Parameters</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={inputs.projectName}
                      onChange={(e) => setInputs(prev => ({ ...prev, projectName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Renovation Cost (₦)</label>
                    <input
                      type="number"
                      value={inputs.renovationCost}
                      onChange={(e) => handleInputChange('renovationCost', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Units After Renovation</label>
                    <input
                      type="number"
                      value={inputs.numberOfUnits}
                      onChange={(e) => handleInputChange('numberOfUnits', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Rent per Unit (₦)</label>
                    <input
                      type="number"
                      value={inputs.projectedAnnualRentPerUnit}
                      onChange={(e) => handleInputChange('projectedAnnualRentPerUnit', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agreement Fee per Unit (₦)</label>
                    <input
                      type="number"
                      value={inputs.agreementFeePerUnit}
                      onChange={(e) => handleInputChange('agreementFeePerUnit', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Operating Expenses (% of Annual Rent)</label>
                    <input
                      type="number"
                      value={inputs.operatingExpensesPercent}
                      onChange={(e) => handleInputChange('operatingExpensesPercent', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      placeholder="e.g., 10 for 10%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculated: ₦{((inputs.projectedAnnualRentPerUnit * inputs.numberOfUnits * inputs.operatingExpensesPercent / 100) / 1000).toFixed(0)}K annually</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">OR Monthly Operating Expenses (₦)</label>
                    <input
                      type="number"
                      value={inputs.operatingExpensesMonthly}
                      onChange={(e) => handleInputChange('operatingExpensesMonthly', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      placeholder="Only if percentage above is 0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use this only if percentage field above is set to 0</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Management Fee (%)</label>
                      <input
                        type="number"
                        value={inputs.managementFee}
                        onChange={(e) => handleInputChange('managementFee', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Vacancy Rate (%)</label>
                      <input
                        type="number"
                        value={inputs.vacancyRate}
                        onChange={(e) => handleInputChange('vacancyRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Results Section */}
              <div className="lg:col-span-2 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-l-4 border-blue-500 hover:shadow-lg transition-all cursor-help" title="Total percentage return on your investment">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">Total Investment</h3>
                    <p className="text-2xl font-bold text-blue-600">₦{(basicCalculations.totalInvestment / 1000000).toFixed(1)}M</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-l-4 border-green-500 hover:shadow-lg transition-all cursor-help" title="First year return including agreement fees">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">First Year ROI</h3>
                    <p className="text-2xl font-bold text-green-600">{basicCalculations.firstYearROI.toFixed(1)}%</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-l-4 border-purple-500 hover:shadow-lg transition-all cursor-help" title="Time to recover initial investment">
                    <h3 className="text-sm font-semibold text-purple-800 mb-2">Payback Period</h3>
                    <p className="text-2xl font-bold text-purple-600">{basicCalculations.paybackWithAgreementFees.toFixed(1)} years</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border-l-4 border-orange-500 hover:shadow-lg transition-all cursor-help" title="Annual ROI excluding one-time agreement fees">
                    <h3 className="text-sm font-semibold text-orange-800 mb-2">Sustained ROI</h3>
                    <p className="text-2xl font-bold text-orange-600">{basicCalculations.sustainedROI.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Cash Flow Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">Investment Recovery Timeline</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={basicCalculations.cashFlowProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Amount (₦ Millions)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value, name) => [
                        name === 'cumulativeReturn' ? `₦${(value / 1000000).toFixed(2)}M` : 
                        name === 'annualCashFlow' ? `₦${(value / 1000000).toFixed(2)}M` : `${value.toFixed(1)}%`,
                        name === 'cumulativeReturn' ? 'Cumulative Return' : 
                        name === 'annualCashFlow' ? 'Annual Cash Flow' : 'Investment Recovered'
                      ]} />
                      <Legend />
                      <Line type="monotone" dataKey="cumulativeReturn" stroke="#3B82F6" strokeWidth={3} name="Cumulative Return" />
                      <Line type="monotone" dataKey="annualCashFlow" stroke="#F59E0B" strokeWidth={2} name="Annual Cash Flow" />
                      <Line type="monotone" dataKey="investmentRecovered" stroke="#10B981" strokeWidth={2} name="Investment Recovered %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Scenario Analysis */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">Scenario Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold">Scenario</th>
                          <th className="text-right py-3 px-4 font-semibold">Investment</th>
                          <th className="text-right py-3 px-4 font-semibold">1st Year ROI</th>
                          <th className="text-right py-3 px-4 font-semibold">Sustained ROI</th>
                          <th className="text-right py-3 px-4 font-semibold">Payback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivityAnalysis.map((scenario, index) => (
                          <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${scenario.scenario === 'Base Case' ? 'bg-blue-50 border-blue-200' : ''}`}>
                            <td className="py-3 px-4 font-medium">{scenario.scenario}</td>
                            <td className="text-right py-3 px-4">₦{(scenario.investment / 1000000).toFixed(1)}M</td>
                            <td className="text-right py-3 px-4">{scenario.firstYearROI.toFixed(1)}%</td>
                            <td className="text-right py-3 px-4">{scenario.sustainedROI.toFixed(1)}%</td>
                            <td className="text-right py-3 px-4">{scenario.paybackYears.toFixed(1)} years</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Advanced Input Section */}
              <div className="lg:col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Advanced Parameters</h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-3">Rent Escalation</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rent Increase Rate (%)</label>
                        <input
                          type="number"
                          value={inputs.rentIncreaseRate}
                          onChange={(e) => handleInputChange('rentIncreaseRate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Increase Every (Years)</label>
                        <input
                          type="number"
                          value={inputs.rentIncreaseFrequency}
                          onChange={(e) => handleInputChange('rentIncreaseFrequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-3">Landlord Payment Tiers</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded border">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tier 1: Years 1-{inputs.landlordPaymentTier1Years}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Years"
                            value={inputs.landlordPaymentTier1Years}
                            onChange={(e) => handleInputChange('landlordPaymentTier1Years', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <input
                            type="number"
                            placeholder="% of rent"
                            value={inputs.landlordPaymentTier1Percent}
                            onChange={(e) => handleInputChange('landlordPaymentTier1Percent', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tier 2: Years {inputs.landlordPaymentTier1Years + 1}-{inputs.landlordPaymentTier1Years + inputs.landlordPaymentTier2Years}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Years"
                            value={inputs.landlordPaymentTier2Years}
                            onChange={(e) => handleInputChange('landlordPaymentTier2Years', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <input
                            type="number"
                            placeholder="% of rent"
                            value={inputs.landlordPaymentTier2Percent}
                            onChange={(e) => handleInputChange('landlordPaymentTier2Percent', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tier 3: Year {inputs.landlordPaymentTier1Years + inputs.landlordPaymentTier2Years + 1}+</label>
                        <input
                          type="number"
                          placeholder="% of rent"
                          value={inputs.landlordPaymentTier3Percent}
                          onChange={(e) => handleInputChange('landlordPaymentTier3Percent', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projection Years</label>
                    <input
                      type="number"
                      value={inputs.projectionYears}
                      onChange={(e) => handleInputChange('projectionYears', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Results Section */}
              <div className="lg:col-span-3 space-y-8">
                {/* Advanced Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-blue-500 hover:shadow-lg transition-all">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Total Investment</h3>
                    <p className="text-lg font-bold text-blue-600">₦{(advancedCalculations.totalInvestment / 1000000).toFixed(1)}M</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-l-4 border-green-500 hover:shadow-lg transition-all">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">Payback Period</h3>
                    <p className="text-lg font-bold text-green-600">{advancedCalculations.paybackPeriod.toFixed(1)} years</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-purple-500 hover:shadow-lg transition-all">
                    <h3 className="text-sm font-semibold text-purple-800 mb-1">Total ROI</h3>
                    <p className="text-lg font-bold text-purple-600">{advancedCalculations.totalROI.toFixed(1)}%</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-l-4 border-orange-500 hover:shadow-lg transition-all">
                    <h3 className="text-sm font-semibold text-orange-800 mb-1">IRR</h3>
                    <p className="text-lg font-bold text-orange-600">{advancedCalculations.irr.toFixed(1)}%</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border-l-4 border-teal-500 hover:shadow-lg transition-all">
                    <h3 className="text-sm font-semibold text-teal-800 mb-1">NPV</h3>
                    <p className="text-lg font-bold text-teal-600">₦{(advancedCalculations.npv / 1000000).toFixed(1)}M</p>
                  </div>
                </div>

                {/* Detailed Breakdown Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Year-by-Year Financial Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-3 font-semibold">Year</th>
                          <th className="text-right py-3 px-3 font-semibold">Annual Rent</th>
                          <th className="text-right py-3 px-3 font-semibold">Landlord %</th>
                          <th className="text-right py-3 px-3 font-semibold">Landlord Payment</th>
                          <th className="text-right py-3 px-3 font-semibold">Investor Income</th>
                          <th className="text-right py-3 px-3 font-semibold">Annual ROI</th>
                          <th className="text-right py-3 px-3 font-semibold">Cumulative ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedCalculations.projectionData.map((data, index) => (
                          <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 transition-all ${data.breakEven ? 'bg-green-50 border-green-200' : ''}`}>
                            <td className="py-3 px-3 font-medium">{data.year}</td>
                            <td className="text-right py-3 px-3">₦{(data.currentAnnualRent / 1000000).toFixed(2)}M</td>
                            <td className="text-right py-3 px-3">{data.landlordPaymentPercent}%</td>
                            <td className="text-right py-3 px-3">₦{(data.landlordPayment / 1000).toFixed(0)}K</td>
                            <td className="text-right py-3 px-3 font-semibold text-green-600">₦{(data.investorNetIncome / 1000).toFixed(0)}K</td>
                            <td className="text-right py-3 px-3">{data.annualROI.toFixed(1)}%</td>
                            <td className="text-right py-3 px-3 font-semibold">{data.cumulativeROI.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-8">
              {/* Sensitivity Controls */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-xl border border-yellow-200">
                <h3 className="text-2xl font-semibold mb-6 text-orange-800">Sensitivity & Risk Analysis</h3>
                <p className="text-orange-700 mb-6">Test how changes in key variables affect your investment returns. Move the sliders to see real-time impact on ROI and payback period.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <label className="block text-sm font-semibold text-orange-800 mb-3">Rent Change</label>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      value={inputs.rentSensitivity}
                      onChange={(e) => handleInputChange('rentSensitivity', e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-lg font-bold text-orange-600 mt-2">{inputs.rentSensitivity}%</div>
                  </div>

                  <div className="text-center">
                    <label className="block text-sm font-semibold text-orange-800 mb-3">Vacancy Period</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="24" 
                      value={inputs.vacancySensitivity}
                      onChange={(e) => handleInputChange('vacancySensitivity', e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-lg font-bold text-orange-600 mt-2">{inputs.vacancySensitivity} months</div>
                  </div>

                  <div className="text-center">
                    <label className="block text-sm font-semibold text-orange-800 mb-3">Cost Overrun</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={inputs.costSensitivity}
                      onChange={(e) => handleInputChange('costSensitivity', e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-lg font-bold text-orange-600 mt-2">+{inputs.costSensitivity}%</div>
                  </div>

                  <div className="text-center">
                    <label className="block text-sm font-semibold text-orange-800 mb-3">Completion Delay</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="18" 
                      value={inputs.delaySensitivity}
                      onChange={(e) => handleInputChange('delaySensitivity', e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-lg font-bold text-orange-600 mt-2">{inputs.delaySensitivity} months</div>
                  </div>
                </div>

                {/* Adjusted Results */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const risk = getRiskAssessment();
                    return (
                      <>
                        <div className="bg-white p-5 rounded-xl border-l-4 border-red-400">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">Adjusted Total ROI</h3>
                          <div className="text-2xl font-bold text-red-600">{advancedCalculations.totalROI.toFixed(1)}%</div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border-l-4 border-red-400">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">Adjusted Payback</h3>
                          <div className="text-2xl font-bold text-red-600">{advancedCalculations.paybackPeriod.toFixed(1)} years</div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border-l-4 border-red-400">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">Risk Level</h3>
                          <div className="text-2xl font-bold" style={{color: risk.color}}>{risk.level}</div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border-l-4 border-red-400">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">Impact</h3>
                          <div className="text-2xl font-bold text-red-600">{risk.impact}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Investment Performance Analysis</h3>
                <div className="space-y-4">
                  {(() => {
                    const adj = advancedCalculations;
                    let analysis = '';
                    
                    if (adj.totalROI >= 150 && adj.paybackPeriod <= 4) {
                      analysis = `EXCELLENT PERFORMANCE: Outstanding ${adj.totalROI.toFixed(1)}% total ROI with ${adj.paybackPeriod.toFixed(1)}-year payback. This investment significantly outperforms Nigerian treasury bills and most alternatives.`;
                    } else if (adj.totalROI >= 100 && adj.paybackPeriod <= 6) {
                      analysis = `SOLID PERFORMANCE: Good ${adj.totalROI.toFixed(1)}% total ROI with reasonable payback period. This investment offers competitive returns.`;
                    } else if (adj.totalROI >= 50) {
                      analysis = `MODERATE PERFORMANCE: Acceptable ${adj.totalROI.toFixed(1)}% returns but consider optimizing rent rates or reducing costs to improve performance.`;
                    } else {
                      analysis = `WEAK PERFORMANCE: Low ${adj.totalROI.toFixed(1)}% returns may not justify the real estate risk. Consider alternative investments or restructuring this deal.`;
                    }

                    const irrAnalysis = adj.irr >= 15 
                      ? `Your ${adj.irr.toFixed(1)}% IRR significantly beats Nigerian treasury bills and most investment alternatives.`
                      : adj.irr >= 10 
                      ? `Your ${adj.irr.toFixed(1)}% IRR is competitive with Nigerian investment options.`
                      : `Your ${adj.irr.toFixed(1)}% IRR may not justify the real estate risk vs safer bonds.`;

                    return (
                      <div className="prose max-w-none">
                        <p className="text-gray-700 mb-4">{analysis}</p>
                        <p className="text-gray-700 mb-4">{irrAnalysis}</p>
                        <p className="text-gray-700">
                          The NPV of ₦{(adj.npv / 1000000).toFixed(1)}M indicates {adj.npv > 0 ? 'value creation' : 'potential value destruction'} 
                          when discounting future cash flows at {inputs.discountRate}% annually.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg">
            <p className="text-sm text-yellow-800 leading-relaxed">
              <strong>Important Notice:</strong> This calculator is designed specifically for the Nigerian real estate market with amounts in Nigerian Naira (₦). 
              The model assumes investors fund renovations and receive rental income until investment recovery, while landlords retain property ownership. 
              Agreement fees are one-time payments collected upon tenant move-in. All projections are estimates based on input assumptions. 
              Conduct thorough market research, due diligence, and consult with financial advisors before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviveCapitalCalculator;
