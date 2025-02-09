import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { User, PickupRequest, SupportTicket } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, TruckIcon, UsersIcon, TicketIcon, MapIcon } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect non-admin users to home page
    if (user && user.role !== "ADMIN") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // If user is not admin, don't render anything
  if (!user?.role !== "ADMIN") {
    return null;
  }

  const { data: users } = useQuery<User[]>({ 
    queryKey: ["/api/users"],
    enabled: user?.role === "ADMIN" 
  });

  const { data: pickupRequests } = useQuery<PickupRequest[]>({ 
    queryKey: ["/api/pickup-requests"],
    enabled: user?.role === "ADMIN"
  });

  const { data: supportTickets } = useQuery<SupportTicket[]>({ 
    queryKey: ["/api/support-tickets"],
    enabled: user?.role === "ADMIN"
  });

  const pendingPickups = pickupRequests?.filter(r => r.status === 'PENDING').length || 0;
  const activeUsers = users?.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0;
  const openTickets = supportTickets?.filter(t => t.status === 'OPEN').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeUsers}</p>
            <p className="text-sm text-muted-foreground">Out of {users?.length || 0} total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Pending Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingPickups}</p>
            <p className="text-sm text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openTickets}</p>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Active Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pickupRequests?.filter(r => r.status === 'IN_PROGRESS').length || 0}</p>
            <p className="text-sm text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pickups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pickups">Pickup Requests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="pickups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pickup Requests</span>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule View
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickupRequests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>#{request.id}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === "COMPLETED" ? "default" :
                          request.status === "IN_PROGRESS" ? "secondary" : "outline"
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{users?.find(u => u.id === request.userId)?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.address}</TableCell>
                      <TableCell>{new Date(request.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportTickets?.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{users?.find(u => u.id === ticket.userId)?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          ticket.status === "CLOSED" ? "default" :
                          ticket.status === "IN_PROGRESS" ? "secondary" : "destructive"
                        }>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}