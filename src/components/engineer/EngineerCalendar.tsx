import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Save, Upload, LogOut, Bell } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface ActivityHour {
  service_category_id: string;
  hours: number;
  description: string;
}

interface DailyActivity {
  id?: string;
  activity_date: string;
  customer_name: string;
  site_location: string;
  notes: string;
  status: 'planning' | 'executed';
  activity_hours: ActivityHour[];
}

interface Notification {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function EngineerCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [activityData, setActivityData] = useState<DailyActivity>({
    activity_date: format(new Date(), "yyyy-MM-dd"),
    customer_name: "",
    site_location: "",
    notes: "",
    status: "executed",
    activity_hours: [],
  });
  const [loading, setLoading] = useState(false);
  const [submittedDates, setSubmittedDates] = useState<Set<string>>(new Set());
  const [planningDates, setPlanningDates] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceCategories();
    fetchSubmittedDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setActivityData((prev) => ({ ...prev, activity_date: dateStr }));
      fetchActivityForDate(dateStr);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, [user]);

  const fetchServiceCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load service categories",
        variant: "destructive",
      });
      return;
    }

    setServiceCategories(data || []);
    // Initialize activity hours for all categories
    setActivityData((prev) => ({
      ...prev,
      activity_hours:
        data?.map((cat) => ({
          service_category_id: cat.id,
          hours: 0,
          description: "",
        })) || [],
    }));
  };

  const fetchSubmittedDates = async () => {
    if (!user) return;

    const { data: engineer } = await supabase
      .from("engineers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!engineer) return;

    const { data, error } = await supabase
      .from("daily_activities")
      .select("activity_date, status")
      .eq("engineer_id", engineer.id);

    if (!error && data) {
      const executed = new Set(data.filter(d => d.status === 'executed').map(d => d.activity_date));
      const planning = new Set(data.filter(d => d.status === 'planning').map(d => d.activity_date));
      setSubmittedDates(executed);
      setPlanningDates(planning);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: engineer } = await supabase
      .from("engineers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!engineer) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`recipient_type.eq.all,and(recipient_type.eq.specific,recipient_engineer_id.eq.${engineer.id})`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { data: engineer } = await supabase
      .from("engineers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!engineer) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .or(`recipient_type.eq.all,and(recipient_type.eq.specific,recipient_engineer_id.eq.${engineer.id})`);
    
    fetchNotifications();
  };

  const fetchActivityForDate = async (date: string) => {
    if (!user) return;

    const { data: engineer } = await supabase
      .from("engineers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!engineer) return;

    const { data: activity } = await supabase
      .from("daily_activities")
      .select(
        `
        *,
        activity_hours (
          service_category_id,
          hours,
          description
        )
      `,
      )
      .eq("engineer_id", engineer.id)
      .eq("activity_date", date)
      .single();

    if (activity) {
      setActivityData({
        id: activity.id,
        activity_date: activity.activity_date,
        customer_name: activity.customer_name || "",
        site_location: activity.site_location || "",
        notes: activity.notes || "",
        status: activity.status || "executed",
        activity_hours: activity.activity_hours || [],
      });
    } else {
      // Reset form for new date
      setActivityData({
        activity_date: date,
        customer_name: "",
        site_location: "",
        notes: "",
        status: "executed",
        activity_hours: serviceCategories.map((cat) => ({
          service_category_id: cat.id,
          hours: 0,
          description: "",
        })),
      });
    }
  };

  const updateActivityHour = (
    categoryId: string,
    field: "hours" | "description",
    value: string | number,
  ) => {
    setActivityData((prev) => ({
      ...prev,
      activity_hours: prev.activity_hours.map((ah) =>
        ah.service_category_id === categoryId ? { ...ah, [field]: value } : ah,
      ),
    }));
  };

  const calculateTotalHours = () => {
    return activityData.activity_hours.reduce(
      (total, ah) => total + (ah.hours || 0),
      0,
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: engineer } = await supabase
        .from("engineers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!engineer) {
        toast({
          title: "Error",
          description: "Engineer profile not found",
          variant: "destructive",
        });
        return;
      }

      const totalHours = calculateTotalHours();

      // Upsert daily activity
      const { data: dailyActivity, error: activityError } = await supabase
        .from("daily_activities")
        .upsert({
          id: activityData.id,
          engineer_id: engineer.id,
          activity_date: activityData.activity_date,
          customer_name: activityData.customer_name,
          site_location: activityData.site_location,
          notes: activityData.notes,
          status: activityData.status,
          total_hours: totalHours,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Delete existing activity hours and insert new ones
      await supabase
        .from("activity_hours")
        .delete()
        .eq("daily_activity_id", dailyActivity.id);

      const hoursToInsert = activityData.activity_hours
        .filter((ah) => ah.hours > 0)
        .map((ah) => ({
          daily_activity_id: dailyActivity.id,
          service_category_id: ah.service_category_id,
          hours: ah.hours,
          description: ah.description,
        }));

      if (hoursToInsert.length > 0) {
        const { error: hoursError } = await supabase
          .from("activity_hours")
          .insert(hoursToInsert);

        if (hoursError) throw hoursError;
      }

      toast({
        title: "Success",
        description: activityData.status === 'planning' 
          ? "Planning activity saved successfully!" 
          : "Activity submitted successfully!",
      });
      fetchSubmittedDates();
    } catch (error) {
      console.error("Error submitting activity:", error);
      toast({
        title: "Error",
        description: "Failed to submit activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const isDateSubmitted = (date: Date) => {
    return submittedDates.has(format(date, "yyyy-MM-dd"));
  };

  const isDatePlanning = (date: Date) => {
    return planningDates.has(format(date, "yyyy-MM-dd"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ACOEM Daily Activity
            </h1>
            <p className="text-gray-600">
              Select a date and log your daily engineering activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNotifications(true)}
              className="flex items-center gap-2 relative"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
              <CardDescription>
                Choose a date to log your activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  submitted: (date) => isDateSubmitted(date),
                  planning: (date) => isDatePlanning(date),
                }}
                modifiersStyles={{
                  submitted: { backgroundColor: "#10b981", color: "white" },
                  planning: { backgroundColor: "#f59e0b", color: "white" },
                }}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Executed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                  <span className="text-sm text-gray-600">Not submitted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Form Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Details -{" "}
                {selectedDate
                  ? format(selectedDate, "MMMM d, yyyy")
                  : "Select a date"}
              </CardTitle>
              <CardDescription>
                Log your hours across different service categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status">Activity Status</Label>
                <Select
                  value={activityData.status}
                  onValueChange={(value: 'planning' | 'executed') =>
                    setActivityData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="executed">Executed</SelectItem>
                  </SelectContent>
                </Select>
                {activityData.status === 'planning' && (
                  <p className="text-sm text-amber-600">
                    This will be saved as a planned activity. Change to "Executed" once completed.
                  </p>
                )}
              </div>

              {/* Customer and Site Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input
                    id="customer"
                    value={activityData.customer_name}
                    onChange={(e) =>
                      setActivityData((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site Location</Label>
                  <Input
                    id="site"
                    value={activityData.site_location}
                    onChange={(e) =>
                      setActivityData((prev) => ({
                        ...prev,
                        site_location: e.target.value,
                      }))
                    }
                    placeholder="Enter site location"
                  />
                </div>
              </div>

              {/* Service Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Service Categories
                  </Label>
                  <Badge variant="secondary" className="text-sm">
                    Total: {calculateTotalHours().toFixed(1)} hours
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceCategories.map((category) => {
                    const activityHour = activityData.activity_hours.find(
                      (ah) => ah.service_category_id === category.id,
                    );
                    return (
                      <Card key={category.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="font-medium">
                              {category.name}
                            </Label>
                            <p className="text-xs text-gray-500">
                              {category.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label
                                htmlFor={`hours-${category.id}`}
                                className="text-xs"
                              >
                                Hours
                              </Label>
                              <Input
                                id={`hours-${category.id}`}
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={activityHour?.hours || 0}
                                onChange={(e) =>
                                  updateActivityHour(
                                    category.id,
                                    "hours",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`desc-${category.id}`}
                                className="text-xs"
                              >
                                Description
                              </Label>
                              <Input
                                id={`desc-${category.id}`}
                                value={activityHour?.description || ""}
                                onChange={(e) =>
                                  updateActivityHour(
                                    category.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="Brief description"
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={activityData.notes}
                  onChange={(e) =>
                    setActivityData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any additional notes or comments about your activities..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Documents
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || calculateTotalHours() === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : activityData.status === 'planning' ? "Save Planning" : "Save Activity"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Messages from your admin team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Badge className="bg-blue-500">New</Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}