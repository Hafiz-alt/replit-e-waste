import { useQuery } from "@tanstack/react-query";
import { PickupRequest, Notification } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TruckIcon, PackageSearchIcon, CheckCircleIcon, BellIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function RecyclerDashboard() {
  const { toast } = useToast();

  const { data: pickupRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests"],
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/pickup-requests/${id}/status`, { status });

      // Calculate impact when marking as completed
      if (status === "COMPLETED") {
        const request = pickupRequests?.find(r => r.id === id);
        const carbonSaved = request?.items.reduce((total, item) => 
          total + (item.estimatedCarbonImpact || 0), 0) || 0;
        const points = Math.floor(carbonSaved * 10); // 10 points per kg of CO2 saved

        await apiRequest("PATCH", `/api/pickup-requests/${id}/impact`, { 
          carbonSaved,
          points 
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests"] });
      toast({
        title: "Status Updated",
        description: `Request status updated to ${status}`,
      });
    } catch (error) {
      console.error("Failed to update request status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const pendingRequests = pickupRequests?.filter((r) => r.status === "PENDING") || [];
  const inProgressRequests = pickupRequests?.filter((r) => r.status === "IN_PROGRESS") || [];
  const completedRequests = pickupRequests?.filter((r) => r.status === "COMPLETED") || [];
  const unreadNotifications = notifications?.filter((n) => !n.read) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearchIcon className="h-5 w-5" />
              Pending Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgressRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              New Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unreadNotifications.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Carbon Impact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickupRequests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge variant={
                          request.status === "COMPLETED" ? "default" :
                          request.status === "IN_PROGRESS" ? "secondary" : "outline"
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.address}</TableCell>
                      <TableCell>
                        {new Date(request.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {parseFloat(request.carbonSaved?.toString() || '0').toFixed(2)} kg CO₂
                      </TableCell>
                      <TableCell>
                        {request.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => updateRequestStatus(request.id, "IN_PROGRESS")}
                          >
                            Start Processing
                          </Button>
                        )}
                        {request.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            onClick={() => updateRequestStatus(request.id, "COMPLETED")}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              {notifications?.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 mb-2 rounded-lg border ${
                    !notification.read ? 'bg-primary/5 border-primary' : 'bg-transparent'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}