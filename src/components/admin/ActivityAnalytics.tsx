import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, TrendingUp, Clock, Users, Calendar, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isWithinInterval } from "date-fns";

interface Engineer {
  id: string;
  employee_id: string;
  full_name: string;
  weekly_hour_requirement: number;
}

interface DailyActivity {
  id: string;
  activity_date: string;
  total_hours: number;
  engineer: {
    full_name: string;
    employee_id: string;
  };
  activity_hours: {
    hours: number;
    service_categories: {
      name: string;
    };
  }[];
}

interface ActivityAnalyticsProps {
  activities: DailyActivity[];
  engineers: Engineer[];
}

interface CategoryStats {
  name: string;
  totalHours: number;
  percentage: number;
  color: string;
}

interface EngineerPerformance {
  engineer: Engineer;
  totalHours: number;
  weeklyAverage: number;
  completionRate: number;
  daysWorked: number;
}

const CATEGORY_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function ActivityAnalytics({ activities, engineers }: ActivityAnalyticsProps) {
  const [startDate, setStartDate] = useState<string>(format(subWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEngineerForCategory, setSelectedEngineerForCategory] = useState<string>('all');
  const [filteredActivities, setFilteredActivities] = useState<DailyActivity[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    filterActivitiesByDateRange();
  }, [activities, startDate, endDate]);

  const filterActivitiesByDateRange = () => {
    if (!startDate || !endDate) {
      setFilteredActivities(activities);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filtered = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return isWithinInterval(activityDate, { start, end });
    });

    setFilteredActivities(filtered);
  };

  // Get all unique service categories for filtering
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    filteredActivities.forEach(activity => {
      activity.activity_hours?.forEach(ah => {
        if (ah.service_categories?.name) {
          categorySet.add(ah.service_categories.name);
        }
      });
    });
    return Array.from(categorySet).sort();
  }, [filteredActivities]);

  const categoryStats = useMemo((): CategoryStats[] => {
    const categoryMap = new Map<string, number>();
    let totalHours = 0;

    // Filter by selected engineer for category breakdown
    const activitiesToAnalyze = selectedEngineerForCategory === 'all' 
      ? filteredActivities 
      : filteredActivities.filter(a => a.engineer?.employee_id === selectedEngineerForCategory);

    activitiesToAnalyze.forEach(activity => {
      activity.activity_hours?.forEach(ah => {
        const categoryName = ah.service_categories?.name || 'Unknown';
        if (!excludedCategories.has(categoryName)) {
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + ah.hours);
          totalHours += ah.hours;
        }
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, hours], index) => ({
        name,
        totalHours: hours,
        percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);
  }, [filteredActivities, selectedEngineerForCategory, excludedCategories]);

  const engineerPerformance = useMemo((): EngineerPerformance[] => {
    return engineers.map(engineer => {
      const engineerActivities = filteredActivities.filter(
        activity => activity.engineer?.employee_id === engineer.employee_id
      );

      // Filter out excluded categories
      const totalHours = engineerActivities.reduce((sum, activity) => {
        const activityHours = activity.activity_hours?.reduce((actSum, ah) => {
          if (!excludedCategories.has(ah.service_categories?.name || '')) {
            return actSum + ah.hours;
          }
          return actSum;
        }, 0) || 0;
        return sum + activityHours;
      }, 0);

      const daysWorked = engineerActivities.length;
      
      // Calculate based on date range
      const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const weeklyAverage = (totalHours / daysDiff) * 7;

      const completionRate = engineer.weekly_hour_requirement > 0 
        ? Math.min((weeklyAverage / engineer.weekly_hour_requirement) * 100, 100)
        : 0;

      return {
        engineer,
        totalHours,
        weeklyAverage,
        completionRate,
        daysWorked
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredActivities, engineers, startDate, endDate, excludedCategories]);

  const overallStats = useMemo(() => {
    const totalHours = filteredActivities.reduce((sum, activity) => sum + activity.total_hours, 0);
    const totalSubmissions = filteredActivities.length;
    const uniqueEngineers = new Set(filteredActivities.map(a => a.engineer?.employee_id)).size;
    const avgHoursPerSubmission = totalSubmissions > 0 ? totalHours / totalSubmissions : 0;

    return {
      totalHours,
      totalSubmissions,
      uniqueEngineers,
      avgHoursPerSubmission
    };
  }, [filteredActivities]);

  // Calculate max hours for chart scaling
  const maxHours = useMemo(() => {
    const maxWorked = Math.max(...engineerPerformance.map(p => p.totalHours), 0);
    const maxRequired = Math.max(...engineerPerformance.map(p => p.engineer.weekly_hour_requirement), 0);
    return Math.max(maxWorked, maxRequired) * 1.1; // Add 10% padding
  }, [engineerPerformance]);

  const maxCategoryHours = useMemo(() => {
    return Math.max(...categoryStats.map(c => c.totalHours), 0) * 1.1;
  }, [categoryStats]);

  const handleCategoryToggle = (categoryName: string, checked: boolean) => {
    const newExcluded = new Set(excludedCategories);
    if (checked) {
      newExcluded.delete(categoryName);
    } else {
      newExcluded.add(categoryName);
    }
    setExcludedCategories(newExcluded);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Selection
          </CardTitle>
          <CardDescription>
            Select custom date range for analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">From Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">To Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(format(subWeeks(today, 1), 'yyyy-MM-dd'));
                    setEndDate(format(today, 'yyyy-MM-dd'));
                  }}
                >
                  Last Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'));
                    setEndDate(format(today, 'yyyy-MM-dd'));
                  }}
                >
                  This Month
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats.totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submissions</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.totalSubmissions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Engineers</p>
                <p className="text-2xl font-bold text-purple-600">{overallStats.uniqueEngineers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                <p className="text-2xl font-bold text-orange-600">{overallStats.avgHoursPerSubmission.toFixed(1)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Engineer Performance Chart - Vertical */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Engineer Performance - Hours Comparison</CardTitle>
                <CardDescription>
                  Compare actual hours worked vs required weekly hours (vertical view)
                </CardDescription>
              </div>
              <div className="w-64">
                <Label className="text-xs text-gray-600 mb-1 block">Category Filter</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                      {allCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={!excludedCategories.has(category)}
                            onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                          />
                          <Label htmlFor={category} className="text-sm">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {engineerPerformance.map((performance) => (
                <div key={performance.engineer.id} className="space-y-2">
                  <div className="text-center">
                    <p className="text-xs font-medium truncate">{performance.engineer.full_name}</p>
                    <p className="text-xs text-gray-500">{performance.engineer.employee_id}</p>
                  </div>
                  
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-end">
                    {/* Required hours bar (background) */}
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-gray-300 opacity-50"
                      style={{ 
                        height: `${(performance.engineer.weekly_hour_requirement / maxHours) * 100}%` 
                      }}
                    />
                    
                    {/* Actual hours bar */}
                    <div 
                      className={`absolute bottom-0 left-0 w-full transition-all ${
                        performance.totalHours >= performance.engineer.weekly_hour_requirement 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                      }`}
                      style={{ 
                        height: `${(performance.totalHours / maxHours) * 100}%` 
                      }}
                    />
                    
                    {/* Labels */}
                    <div className="absolute inset-0 flex flex-col justify-between items-center p-2 text-center">
                      <span className="text-xs font-medium text-white drop-shadow">
                        {performance.totalHours.toFixed(1)}h
                      </span>
                      {performance.totalHours < performance.engineer.weekly_hour_requirement && (
                        <span className="text-xs font-medium text-gray-600">
                          {performance.engineer.weekly_hour_requirement}h
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Badge 
                      variant={performance.completionRate >= 100 ? "default" : performance.completionRate >= 80 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {performance.completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Actual Hours</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Required Hours</span>
              </div>
            </div>
            
            {engineerPerformance.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No engineer data available.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Category Breakdown</CardTitle>
                <CardDescription>
                  Hours distribution across service categories
                </CardDescription>
              </div>
              <div className="w-64">
                <Label className="text-xs text-gray-600 mb-1 block">Filter by Engineer</Label>
                <Select value={selectedEngineerForCategory} onValueChange={setSelectedEngineerForCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All engineers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Engineers</SelectItem>
                    {engineers.map(engineer => (
                      <SelectItem key={engineer.id} value={engineer.employee_id}>
                        {engineer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{category.totalHours.toFixed(1)}h</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full transition-all"
                      style={{ 
                        width: `${(category.totalHours / maxCategoryHours) * 100}%`,
                        backgroundColor: category.color
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-white drop-shadow">
                        {category.totalHours.toFixed(1)} hours
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {categoryStats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No activity data available for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}