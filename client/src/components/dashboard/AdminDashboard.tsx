import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { User, PickupRequest, SupportTicket } from "@shared/schema";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: pickupRequests } = useQuery<PickupRequest[]>({ 
    queryKey: ["/api/pickup-requests"] 
  });
  const { data: supportTickets } = useQuery<SupportTicket[]>({ 
    queryKey: ["/api/support-tickets"] 
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {pickupRequests?.filter(r => r.status === 'PENDING').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {supportTickets?.filter(t => t.status === 'OPEN').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Pickup Requests</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pickup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add pickup requests table here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add support tickets table here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add users table here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
