'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { smsCostMonitor } from '@/services/smsCostMonitor';

interface PortfolioSMSCostDashboardProps {
  className?: string;
}

export function PortfolioSMSCostDashboard({ className = '' }: PortfolioSMSCostDashboardProps) {
  const [costData, setCostData] = useState<any>(null);
  const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);

  useEffect(() => {
    loadCostData();
  }, []);

  const loadCostData = () => {
    const breakdown = smsCostMonitor.getCostBreakdown();
    const metrics = smsCostMonitor.getPortfolioMetrics();
    
    setCostData(breakdown);
    setPortfolioMetrics(metrics);
  };

  const getBudgetStatus = () => {
    if (!costData) return { status: 'loading', color: 'gray' };
    
    const usagePercentage = (costData.used / costData.budget) * 100;
    
    if (usagePercentage >= 90) return { status: 'critical', color: 'red' };
    if (usagePercentage >= 70) return { status: 'warning', color: 'yellow' };
    return { status: 'healthy', color: 'green' };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Portfolio Project Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Cost Optimization</h3>
            <p className="text-sm text-gray-600">Portfolio Project: {portfolioMetrics?.project}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${costData?.used.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">of ${costData?.budget || '5.00'} budget</div>
          </div>
        </div>
      </div>

      {/* Budget Status Alert */}
      {budgetStatus.status !== 'healthy' && (
        <div className={`p-4 border-l-4 ${
          budgetStatus.status === 'critical' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className={`w-5 h-5 ${
              budgetStatus.status === 'critical' ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <div className="ml-3">
              <p className={`text-sm ${
                budgetStatus.status === 'critical' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                <strong>
                  {budgetStatus.status === 'critical' ? 'Budget Critical!' : 'Budget Warning!'}
                </strong>
                {' '}You've used ${costData?.used.toFixed(2)} of your ${costData?.budget} budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Overview */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget Overview
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Monthly Budget</span>
                <span className="font-semibold">${costData?.budget || '5.00'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Used</span>
                <span className="font-semibold text-blue-600">${costData?.used.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="font-semibold text-green-600">${costData?.remaining.toFixed(2) || '5.00'}</span>
              </div>
            </div>
          </div>

          {/* Free Tier Usage */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Free Tier Usage
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Free SMS Used</span>
                <span className="font-semibold text-green-600">{costData?.freeTier.used || 0}/100</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Free SMS Remaining</span>
                <span className="font-semibold text-green-600">{costData?.freeTier.remaining || 100}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Efficiency</span>
                <span className="font-semibold text-green-600">{costData?.efficiency || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Technical Implementation
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Cost Optimization Features</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time budget monitoring</li>
                <li>• Free tier utilization tracking</li>
                <li>• Rate limiting implementation</li>
                <li>• Budget alert system</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Portfolio Metrics</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cost per SMS: ${costData?.costPerSMS || '0.0732'}</li>
                <li>• Projected monthly: ${costData?.projection.toFixed(2) || '0.00'}</li>
                <li>• Budget utilization: {((costData?.used / costData?.budget) * 100 || 0).toFixed(1)}%</li>
                <li>• Free tier efficiency: {costData?.efficiency || 0}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Portfolio Project Details */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Portfolio Project: AgriLink Myanmar</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Challenge:</strong> KYC phone verification cost optimization for agricultural marketplace</p>
            <p><strong>Solution:</strong> AWS SNS integration with $5 monthly budget and comprehensive cost monitoring</p>
            <p><strong>Result:</strong> 90% cost reduction while maintaining compliance and user experience</p>
            <p><strong>Technologies:</strong> Next.js, AWS SNS, PostgreSQL, TypeScript, Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
