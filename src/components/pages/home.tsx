import { useAuth } from "../../../supabase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Clock,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Shield,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Calendar,
      title: "Calendar-Based Logging",
      description:
        "Intuitive calendar interface for selecting dates and logging daily activities",
      color: "text-blue-600",
    },
    {
      icon: Clock,
      title: "Service Category Tracking",
      description:
        "Track hours across 15+ service categories including installation, maintenance, and repair",
      color: "text-green-600",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Comprehensive analytics with visual charts and performance metrics",
      color: "text-purple-600",
    },
    {
      icon: Users,
      title: "Engineer Management",
      description:
        "Complete engineer account management with role-based access control",
      color: "text-orange-600",
    },
    {
      icon: FileText,
      title: "Document Upload",
      description:
        "Attach relevant documents and files to daily activity submissions",
      color: "text-indigo-600",
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description:
        "Monitor team performance, track hours, and analyze productivity trends",
      color: "text-red-600",
    },
  ];

  const benefits = [
    "Real-time activity tracking and submission",
    "Mobile-responsive design for field use",
    "Automated notifications for missed submissions",
    "Customizable weekly hour requirements",
    "Data export capabilities for reporting",
    "Secure cloud-based storage with Supabase",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ACOEM Daily Activity
                </h1>
                <p className="text-sm text-gray-600">
                  Engineer Daily Activity Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <a href="/login">Sign In</a>
              </Button>
              <Button asChild>
                <a href="/signup">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <img
            src="https://fixturlaser.com/wp-content/uploads/2021/05/ACOEM-LOGO-WithoutBaseline-CMYK-Bicolor-768x237.png"
            alt="Acoem Logo"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ACOEM
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              Daily Activity Manager
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Smart Engineer Activity manager
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/signup" className="flex items-center gap-2">
                Start Tracking Activities
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              asChild
            >
              <a href="/login">Sign In to Dashboard</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to track, manage, and analyze engineering
              activities in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Activity Tracker?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built specifically for engineering teams, our platform combines
                ease of use with powerful analytics to help you track, manage,
                and optimize your daily operations.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                <div className="text-sm text-gray-600">Service Categories</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-600">Access Anywhere</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-600">Cloud-Based</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">∞</div>
                <div className="text-sm text-gray-600">Scalable</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Activity Tracking?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join engineering teams who trust our platform to streamline their
            daily operations and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              asChild
            >
              <a href="/signup" className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Account
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <a href="/login">Access Dashboard</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acoem Activity Tracker</span>
          </div>
          <p className="text-gray-400 mb-4">
            Professional engineering activity management platform
          </p>
          <p className="text-sm text-gray-500">
            © 2024 Acoem Activity Tracker. Built with modern web technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
