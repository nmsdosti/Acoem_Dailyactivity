import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  Clock,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { EngineerManagement } from "./EngineerManagement";
import { ActivityAnalytics } from "./ActivityAnalytics";
import { useAuth } from "../../../supabase/auth";

interface Engineer {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  weekly_hour_requirement: number;
  is_active: boolean;
}

interface DailyActivity {
  id: string;
  activity_date: string;
  customer_name: string;
  site_location: string;
  total_hours: number;
  notes: string;
  submitted_at: string;
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

interface FilterState {
  engineer_id: string;
  date_from: string;
  date_to: string;
  customer: string;
  site: string;
}

export default function AdminDashboard() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<DailyActivity[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    engineer_id: "all",
    date_from: format(startOfWeek(new Date()), "yyyy-MM-dd"),
    date_to: format(endOfWeek(new Date()), "yyyy-MM-dd"),
    customer: "",
    site: "",
  });
  const [stats, setStats] = useState({
    totalEngineers: 0,
    activeEngineers: 0,
    totalSubmissions: 0,
    avgHoursPerDay: 0,
    missedSubmissions: 0,
  });

  const { toast } = useToast();
  const { signOut } = useAuth();

  useEffect(() => {
    fetchEngineers();
    fetchActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, filters]);

  const fetchEngineers = async () => {
    const { data, error } = await supabase
      .from("engineers")
      .select("*")
      .order("full_name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load engineers",
        variant: "destructive",
      });
      return;
    }

    setEngineers(data || []);
    setStats((prev) => ({
      ...prev,
      totalEngineers: data?.length || 0,
      activeEngineers: data?.filter((e) => e.is_active).length || 0,
    }));
  };

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_activities")
      .select(
        `
        *,
        engineers!inner (
          full_name,
          employee_id
        ),
        activity_hours (
          hours,
          service_categories (
            name
          )
        )
      `,
      )
      .order("activity_date", { ascending: false })
      .order("submitted_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formattedData =
      data?.map((activity) => ({
        ...activity,
        engineer: activity.engineers,
      })) || [];

    setActivities(formattedData);

    // Calculate stats
    const totalHours = formattedData.reduce(
      (sum, activity) => sum + (activity.total_hours || 0),
      0,
    );
    setStats((prev) => ({
      ...prev,
      totalSubmissions: formattedData.length,
      avgHoursPerDay:
        formattedData.length > 0 ? totalHours / formattedData.length : 0,
    }));

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...activities];

    if (filters.engineer_id && filters.engineer_id !== "all") {
      filtered = filtered.filter(
        (activity) => activity.engineer?.employee_id === filters.engineer_id,
      );
    }

    if (filters.date_from) {
      filtered = filtered.filter(
        (activity) => activity.activity_date >= filters.date_from,
      );
    }

    if (filters.date_to) {
      filtered = filtered.filter(
        (activity) => activity.activity_date <= filters.date_to,
      );
    }

    if (filters.customer) {
      filtered = filtered.filter((activity) =>
        activity.customer_name
          ?.toLowerCase()
          .includes(filters.customer.toLowerCase()),
      );
    }

    if (filters.site) {
      filtered = filtered.filter((activity) =>
        activity.site_location
          ?.toLowerCase()
          .includes(filters.site.toLowerCase()),
      );
    }

    setFilteredActivities(filtered);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this activity? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("daily_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });

      fetchActivities();
    } catch (error: any) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      [
        "Date",
        "Engineer",
        "Customer",
        "Site",
        "Total Hours",
        "Categories",
        "Notes",
      ].join(","),
      ...filteredActivities.map((activity) =>
        [
          activity.activity_date,
          activity.engineer?.full_name || "",
          activity.customer_name || "",
          activity.site_location || "",
          activity.total_hours,
          activity.activity_hours
            ?.map((ah) => `${ah.service_categories?.name}: ${ah.hours}h`)
            .join("; ") || "",
          `"${activity.notes || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      engineer_id: "all",
      date_from: format(startOfWeek(new Date()), "yyyy-MM-dd"),
      date_to: format(endOfWeek(new Date()), "yyyy-MM-dd"),
      customer: "",
      site: "",
    });
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ACOEM Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage engineers and monitor daily activities
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Engineers
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalEngineers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Engineers
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeEngineers}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Submissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalSubmissions}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Hours/Day
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgHoursPerDay.toFixed(1)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Missed Submissions
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.missedSubmissions}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities">Activity Submissions</TabsTrigger>
            <TabsTrigger value="engineers">Engineer Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Engineer</Label>
                    <Select
                      value={filters.engineer_id}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, engineer_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All engineers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Engineers</SelectItem>
                        {engineers.map((engineer) => (
                          <SelectItem
                            key={engineer.id}
                            value={engineer.employee_id}
                          >
                            {engineer.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          date_from: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          date_to: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Input
                      placeholder="Filter by customer"
                      value={filters.customer}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customer: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Input
                      placeholder="Filter by site"
                      value={filters.site}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          site: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button
                    onClick={exportData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activities Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Activity Submissions ({filteredActivities.length})
                </CardTitle>
                <CardDescription>
                  Recent activity submissions from engineers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Engineer</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                              {format(
                                new Date(activity.activity_date),
                                "MMM d, yyyy",
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {activity.engineer?.full_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {activity.engineer?.employee_id}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {activity.customer_name || "-"}
                            </TableCell>
                            <TableCell>
                              {activity.site_location || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {activity.total_hours}h
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {activity.activity_hours
                                  ?.slice(0, 2)
                                  .map((ah, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ah.service_categories?.name}: {ah.hours}h
                                    </Badge>
                                  ))}
                                {activity.activity_hours?.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{activity.activity_hours.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {format(
                                new Date(activity.submitted_at),
                                "MMM d, h:mm a",
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteActivity(activity.id)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engineers">
            <EngineerManagement
              engineers={engineers}
              onEngineersChange={fetchEngineers}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ActivityAnalytics
              activities={filteredActivities}
              engineers={engineers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
