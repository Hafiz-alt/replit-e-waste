import { useAuth } from "@/hooks/use-auth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import RecyclerDashboard from "@/components/dashboard/RecyclerDashboard";
import TechnicianDashboard from "@/components/dashboard/TechnicianDashboard";
import EducatorDashboard from "@/components/dashboard/EducatorDashboard";
import BusinessDashboard from "@/components/dashboard/BusinessDashboard";
import { Button } from "@/components/ui/button";
import { RecycleIcon } from "lucide-react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const DashboardComponent = {
    ADMIN: AdminDashboard,
    USER: UserDashboard,
    RECYCLER: RecyclerDashboard,
    TECHNICIAN: TechnicianDashboard,
    EDUCATOR: EducatorDashboard,
    BUSINESS: BusinessDashboard,
  }[user.role];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RecycleIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">E-Waste Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Welcome, {user.name}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <DashboardComponent />
      </main>
    </div>
  );
}