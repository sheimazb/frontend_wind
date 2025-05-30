// Common interfaces
export interface ErrorTrend {
  date: string;
  count: number;
  type: string;
}

export interface ErrorByType {
  count: number;
  type: string;
}

export interface TestingProgress {
  count: number;
  status: string;
}

export interface OverallStat {
  avgResolutionTime: number;
  count: number;
  status: string;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

// Developer-specific interfaces
export interface DeveloperStats {
  assignedTickets: number;
  resolvedTickets: number;
  inProgressTickets: number;
  ticketsResolvedThisWeek: number;
  totalSolutions: number;
  recentSolutions: any[];
  errorsResolved: number;
  activityTrends: ActivityTrend[];
}

// Manager-specific interfaces
export interface ManagerStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  doneTickets: number;
  newTicketsThisWeek: number;
  resolvedTicketsThisWeek: number;
  criticalErrors: number;
  errorsByDay: Array<{ date: string; count: number }>;
  teamActivity: Array<{ date: string; count: number }>;
  projectHealth: {
    activityTrends: ActivityTrend[];
    projectHealthStats: ProjectHealthStat[];
  };
  qualityMetrics: {
    errorTrends: ErrorTrend[];
    criticalErrors: number;
    errorsByType: ErrorByType[];
  };
}

// Tester-specific interfaces
export interface TesterStats {
  ticketsToTest: number;
  ticketsTested: number;
  ticketsTestedThisWeek: number;
  errorsFound: number;
  errorsByType: ErrorByType[];
  testingProgress: TestingProgress[];
}

export interface ProjectHealthStat {
  lastError: string;
  projectId: number;
  errorCount: number;
}

export interface QualityMetrics {
  errorTrends: ErrorTrend[];
  criticalErrors: number;
  errorsByType: ErrorByType[];
}

export interface TeamPerformance {
  testingProgress: TestingProgress[];
  overallStats: OverallStat[];
}

export interface TimeAnalysis {
  resolvedIssuesThisWeek: number;
  newIssuesThisMonth: number;
  resolvedIssuesThisMonth: number;
  newIssuesThisWeek: number;
}

export interface ProjectHealth {
  activityTrends: ActivityTrend[];
  projectHealthStats: ProjectHealthStat[];
}

export interface ProjectPerformance {
  inProgressRate: number;
  completionRate: number;
}

// Main dashboard data interface
export interface DashboardData {
  qualityMetrics: QualityMetrics;
  teamPerformance: TeamPerformance;
  totalProjects: number;
  timeAnalysis: TimeAnalysis;
  projectHealth: ProjectHealth;
  totalTickets: number;
  activeProjects: number;
  resolvedTickets: number;
  projectPerformance: ProjectPerformance;
}