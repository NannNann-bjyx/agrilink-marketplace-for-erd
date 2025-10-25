// SMS Cost Monitoring for Portfolio Project
export interface SMSCostData {
  userId: string;
  phoneNumber: string;
  cost: number;
  timestamp: Date;
  messageType: 'verification' | 'notification' | 'marketing';
}

export interface MonthlyCostSummary {
  totalSMS: number;
  totalCost: number;
  freeTierUsed: number;
  paidSMS: number;
  remainingBudget: number;
  projectedMonthlyCost: number;
}

class SMSCostMonitor {
  private monthlyBudget = 5.00; // $5 budget for portfolio project
  private freeTierLimit = 100; // AWS free tier
  private costPerSMS = 0.0732; // Myanmar rate
  private smsLog: SMSCostData[] = [];

  // Log SMS cost when sending
  logSMSCost(userId: string, phoneNumber: string, messageType: 'verification' | 'notification' | 'marketing' = 'verification') {
    const costData: SMSCostData = {
      userId,
      phoneNumber,
      cost: this.costPerSMS,
      timestamp: new Date(),
      messageType
    };

    this.smsLog.push(costData);
    
    // Log to console for portfolio demonstration
    console.log(`📱 SMS Cost Logged:`, {
      user: userId,
      phone: phoneNumber,
      cost: `$${this.costPerSMS}`,
      type: messageType,
      timestamp: new Date().toISOString()
    });

    return costData;
  }

  // Get current month's cost summary
  getMonthlyCostSummary(): MonthlyCostSummary {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySMS = this.smsLog.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    const totalSMS = monthlySMS.length;
    const freeTierUsed = Math.min(totalSMS, this.freeTierLimit);
    const paidSMS = Math.max(0, totalSMS - this.freeTierLimit);
    const totalCost = paidSMS * this.costPerSMS;
    const remainingBudget = this.monthlyBudget - totalCost;
    
    // Project monthly cost based on current usage
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const projectedMonthlyCost = totalCost * (daysInMonth / currentDay);

    return {
      totalSMS,
      totalCost,
      freeTierUsed,
      paidSMS,
      remainingBudget,
      projectedMonthlyCost
    };
  }

  // Check if we can send SMS within budget
  canSendSMS(): { allowed: boolean; reason?: string; remainingBudget: number } {
    const summary = this.getMonthlyCostSummary();
    
    if (summary.remainingBudget <= 0) {
      return {
        allowed: false,
        reason: 'Monthly budget exceeded',
        remainingBudget: summary.remainingBudget
      };
    }

    if (summary.remainingBudget < this.costPerSMS) {
      return {
        allowed: false,
        reason: 'Insufficient budget for SMS',
        remainingBudget: summary.remainingBudget
      };
    }

    return {
      allowed: true,
      remainingBudget: summary.remainingBudget
    };
  }

  // Get cost breakdown for portfolio presentation
  getCostBreakdown() {
    const summary = this.getMonthlyCostSummary();
    
    return {
      budget: this.monthlyBudget,
      used: summary.totalCost,
      remaining: summary.remainingBudget,
      freeTier: {
        used: summary.freeTierUsed,
        remaining: this.freeTierLimit - summary.freeTierUsed
      },
      paidSMS: {
        count: summary.paidSMS,
        cost: summary.totalCost
      },
      projection: summary.projectedMonthlyCost,
      efficiency: summary.totalSMS > 0 ? (summary.freeTierUsed / summary.totalSMS * 100).toFixed(1) : 0
    };
  }

  // Portfolio demonstration data
  getPortfolioMetrics() {
    const breakdown = this.getCostBreakdown();
    
    return {
      project: 'AgriLink Myanmar - Agricultural Marketplace',
      challenge: 'KYC phone verification cost optimization',
      solution: 'AWS SNS with $5 monthly budget + cost monitoring',
      metrics: {
        monthlyBudget: `$${breakdown.budget}`,
        currentUsage: `$${breakdown.used.toFixed(2)}`,
        freeTierUtilization: `${breakdown.efficiency}%`,
        costPerSMS: `$${this.costPerSMS}`,
        projectedMonthlyCost: `$${breakdown.projection.toFixed(2)}`
      },
      technicalImplementation: [
        'AWS SNS integration',
        'Real-time cost monitoring',
        'Rate limiting implementation',
        'Budget alert system',
        'Free tier optimization'
      ]
    };
  }
}

export const smsCostMonitor = new SMSCostMonitor();
