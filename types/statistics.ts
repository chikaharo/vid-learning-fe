export interface StatisticsOverview {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
  };
  recentEnrollments: {
    date: string;
    count: string;
  }[];
}
