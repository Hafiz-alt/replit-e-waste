import { useQuery } from "@tanstack/react-query";
import { PickupRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TruckIcon, PackageSearchIcon, CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RecyclerDashboard() {
  const { data: pickupRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests"],
  });

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/pickup-requests/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests"] });
    } catch (error) {
      console.error("Failed to update request status:", error);
    }
  };

  const pendingRequests = pickupRequests?.filter((r) => r.status === "PENDING") || [];
  const inProgressRequests = pickupRequests?.filter((r) => r.status === "IN_PROGRESS") || [];
  const completedRequests = pickupRequests?.filter((r) => r.status === "COMPLETED") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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
  );
}
