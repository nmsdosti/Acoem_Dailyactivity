import { useEffect, useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import EngineerCalendar from "../engineer/EngineerCalendar";
import AdminDashboard from "../admin/AdminDashboard";
import { LoadingScreen } from "../ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle, UserPlus } from "lucide-react";

interface UserProfile {
  id: string;
  role: 'admin' | 'engineer';
  full_name: string;
  email: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      // Check if user is admin first - specifically check for nmspatel210@gmail.com
      const isAdmin = user?.email === 'nmspatel210@gmail.com' || 
                     user?.email?.includes('admin') || 
                     user?.email?.includes('manager');

      if (isAdmin) {
        setUserProfile({
          id: user?.id || '',
          role: 'admin',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User',
          email: user?.email || ''
        });
        setLoading(false);
        return;
      }

      // Then check if user is an engineer
      const { data: engineer, error: engineerError } = await supabase
        .from('engineers')
        .select('id, full_name, email, is_active')
        .eq('user_id', user?.id)
        .single();

      if (engineer && !engineerError) {
        if (!engineer.is_active) {
          setError('Your account has been deactivated. Please contact your administrator.');
          setLoading(false);
          return;
        }
        
        setUserProfile({
          id: engineer.id,
          role: 'engineer',
          full_name: engineer.full_name,
          email: engineer.email
        });
        setLoading(false);
        return;
      }

      // If not admin or engineer, show error
      setError('Access denied. You need to be registered as an engineer or admin to use this system.');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createEngineerProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('engineers')
        .insert({
          user_id: user.id,
          employee_id: `ENG${Date.now()}`, // Generate a temporary employee ID
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Engineer',
          email: user.email || '',
          is_active: true
        });

      if (error) throw error;
      
      // Refresh profile
      await fetchUserProfile();
    } catch (error: any) {
      console.error('Error creating engineer profile:', error);
      setError('Failed to create engineer profile. Please contact your administrator.');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Error
            </CardTitle>
            <CardDescription>
              There was an issue accessing your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{error}</p>
            {error.includes('registered as an engineer') && (
              <Button onClick={createEngineerProfile} className="w-full flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Engineer Profile
              </Button>
            )}
            <Button variant="outline" onClick={fetchUserProfile} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Unable to determine your role in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchUserProfile} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render appropriate dashboard based on role
  if (userProfile.role === 'admin') {
    return <AdminDashboard />;
  } else {
    return <EngineerCalendar />;
  }
}