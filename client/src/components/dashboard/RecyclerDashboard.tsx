import { useQuery } from "@tanstack/react-query";
import { PickupRequest, Notification } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TruckIcon, PackageSearchIcon, CheckCircleIcon, BellIcon, LeafIcon, MapPinIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from '@/hooks/use-websocket';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";

const impactSchema = z.object({
  carbonSaved: z.number().min(0),
  points: z.number().min(0),
});

type ImpactFormData = z.infer<typeof impactSchema>;

export default function RecyclerDashboard() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  useWebSocket();

  const { data: pickupRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests/all"],
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const impactForm = useForm<ImpactFormData>({
    defaultValues: {
      carbonSaved: 0,
      points: 0,
    },
  });

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/pickup-requests/${id}/status`, { status });

      // If completing the request, show impact dialog
      if (status === "COMPLETED") {
        setSelectedRequest(pickupRequests?.find(r => r.id === id) || null);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests/all"] });
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

  const submitImpact = async (data: ImpactFormData) => {
    if (!selectedRequest) return;

    try {
      await apiRequest("PATCH", `/api/pickup-requests/${selectedRequest.id}/impact`, data);
      await updateRequestStatus(selectedRequest.id, "COMPLETED");

      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests/all"] });
      toast({
        title: "Success",
        description: "Environmental impact recorded and request completed",
      });
      setSelectedRequest(null);
    } catch (error) {
      console.error("Failed to record impact:", error);
      toast({
        title: "Error",
        description: "Failed to record environmental impact",
        variant: "destructive",
      });
    }
  };

  const pendingRequests = pickupRequests?.filter((r) => r.status === "PENDING") || [];
  const inProgressRequests = pickupRequests?.filter((r) => r.status === "IN_PROGRESS") || [];
  const completedRequests = pickupRequests?.filter((r) => r.status === "COMPLETED") || [];
  const unreadNotifications = notifications?.filter((n) => !n.read) || [];

  const totalCarbonSaved = completedRequests.reduce((total, request) => 
    total + parseFloat(request.carbonSaved?.toString() || '0'), 0);

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
              <LeafIcon className="h-5 w-5 text-green-600" />
              Total CO₂ Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCarbonSaved.toFixed(2)} kg</p>
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
                    <TableHead>Environmental Impact</TableHead>
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
                      <TableCell className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        {request.address}
                      </TableCell>
                      <TableCell>
                        {new Date(request.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {request.carbonSaved ? (
                          <div className="flex items-center gap-1">
                            <LeafIcon className="h-4 w-4 text-green-600" />
                            {parseFloat(request.carbonSaved.toString()).toFixed(2)} kg CO₂
                          </div>
                        ) : '-'}
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
                            Complete Pickup
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

      {/* Impact Recording Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Environmental Impact</DialogTitle>
            <DialogDescription>
              Record the environmental impact of this pickup before marking it as complete.
            </DialogDescription>
          </DialogHeader>
          <Form {...impactForm}>
            <form onSubmit={impactForm.handleSubmit(submitImpact)} className="space-y-4">
              <FormField
                control={impactForm.control}
                name="carbonSaved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO₂ Saved (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={impactForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Record Impact & Complete</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}