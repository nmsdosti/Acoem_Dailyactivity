import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../../../supabase/supabase";

interface Engineer {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
}

interface DailyActivity {
  id: string;
  activity_date: string;
  customer_name: string;
  site_location: string;
  total_hours: number;
  notes: string;
  status: string;
  engineer: Engineer;
  activity_hours: {
    hours: number;
    service_categories: {
      name: string;
    };
  }[];
}

interface AdminCalendarViewProps {
  engineers: Engineer[];
}

export function AdminCalendarView({ engineers }: AdminCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [allActivities, setAllActivities] = useState<DailyActivity[]>([]);
  const [engineerActivityDates, setEngineerActivityDates] = useState<Map<string, { executed: Set<string>, planning: Set<string> }>>(new Map());
  const [selectedActivities, setSelectedActivities] = useState<DailyActivity[]>([]);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  useEffect(() => {
    fetchAllActivities();
  }, [engineers]);

  useEffect(() => {
    if (selectedDate) {
      fetchActivitiesForDate();
    }
  }, [selectedDate, allActivities]);

  const fetchAllActivities = async () => {
    const { data, error } = await supabase
      .from("daily_activities")
      .select(`
        *,
        engineer:engineers!inner (
          id,
          employee_id,
          full_name,
          email
        ),
        activity_hours (
          hours,
          service_categories (
            name
          )
        )
      `);

    if (!error && data) {
      setAllActivities(data);
      
      // Group activities by engineer and status
      const engineerDates = new Map<string, { executed: Set<string>, planning: Set<string> }>();
      
      data.forEach(activity => {
        const engineerId = activity.engineer.employee_id;
        if (!engineerDates.has(engineerId)) {
          engineerDates.set(engineerId, { executed: new Set(), planning: new Set() });
        }
        
        const dates = engineerDates.get(engineerId)!;
        if (activity.status === 'planning') {
          dates.planning.add(activity.activity_date);
        } else {
          dates.executed.add(activity.activity_date);
        }
      });
      
      setEngineerActivityDates(engineerDates);
    } else {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchActivitiesForDate = () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const activitiesForDate = allActivities.filter(
      activity => activity.activity_date === dateStr
    );

    setSelectedActivities(activitiesForDate);
  };

  const isDateWithActivity = (date: Date, engineerId: string, status: 'executed' | 'planning') => {
    const dateStr = format(date, "yyyy-MM-dd");
    const engineerDates = engineerActivityDates.get(engineerId);
    return engineerDates?.[status].has(dateStr) || false;
  };

  const handleActivityClick = (activities: DailyActivity[]) => {
    setSelectedActivities(activities);
    setShowActivityDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            All Engineers Calendar View
          </CardTitle>
          <CardDescription>
            View all engineer activities across multiple calendars
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {engineers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No engineers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {engineers.map((engineer) => (
                <Card key={engineer.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{engineer.full_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {engineer.employee_id} • {engineer.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border w-full"
                      modifiers={{
                        executed: (date) => isDateWithActivity(date, engineer.employee_id, 'executed'),
                        planning: (date) => isDateWithActivity(date, engineer.employee_id, 'planning'),
                      }}
                      modifiersStyles={{
                        executed: { backgroundColor: "#10b981", color: "white", fontWeight: "bold" },
                        planning: { backgroundColor: "#f59e0b", color: "white", fontWeight: "bold" },
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Executed Activities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Planning Activities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <span className="text-sm text-gray-600">No Activity</span>
            </div>
          </div>

          {/* Selected Date Activities */}
          {selectedDate && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Activities for {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>
                  All engineer activities for the selected date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activities for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedActivities.map((activity) => (
                      <Card 
                        key={activity.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleActivityClick([activity])}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={activity.status === 'planning' ? 'secondary' : 'default'}>
                                {activity.status === 'planning' ? 'Planning' : 'Executed'}
                              </Badge>
                              <Badge variant="outline">{activity.total_hours}h</Badge>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{activity.engineer.full_name}</span>
                              <span className="text-xs">({activity.engineer.employee_id})</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="h-3 w-3" />
                              <span>{activity.customer_name || 'No customer'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>{activity.site_location || 'No location'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Activity Details Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              {selectedActivities.length > 0 && format(new Date(selectedActivities[0].activity_date), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedActivities.length > 0 && (
            <div className="space-y-6">
              {selectedActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={activity.status === 'planning' ? 'secondary' : 'default'}>
                      {activity.status === 'planning' ? 'Planning' : 'Executed'}
                    </Badge>
                    <Badge variant="outline">{activity.total_hours} hours total</Badge>
                    <span className="text-sm text-gray-600 ml-auto">
                      {activity.engineer.full_name} ({activity.engineer.employee_id})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Customer</label>
                      <p className="font-medium">{activity.customer_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Site Location</label>
                      <p className="font-medium">{activity.site_location || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Service Categories</label>
                    <div className="space-y-2">
                      {activity.activity_hours?.map((ah, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{ah.service_categories?.name}</span>
                          <Badge variant="secondary">{ah.hours}h</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activity.notes && (
                    <div>
                      <label className="text-xs text-gray-500">Notes</label>
                      <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{activity.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}