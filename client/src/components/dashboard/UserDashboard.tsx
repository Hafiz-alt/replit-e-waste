import { useQuery } from "@tanstack/react-query";
import { PickupRequest, SupportTicket } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPickupRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarIcon, Package2Icon, TicketIcon, LoaderIcon, LeafIcon, TrophyIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketplaceView from "@/components/marketplace/MarketplaceView";
import type { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

type FormData = z.infer<typeof insertPickupRequestSchema>;

export default function UserDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: pickupRequests, isLoading: isLoadingRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests/user"],
  });

  const { data: supportTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets/user"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertPickupRequestSchema),
    defaultValues: {
      status: "PENDING",
      items: [{
        type: 'general',
        description: 'General e-waste pickup',
        quantity: 1,
        estimatedCarbonImpact: 2.5 // Default carbon impact in kg CO2
      }],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", "/api/pickup-requests", {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        items: [{
          ...data.items[0],
          estimatedCarbonImpact: 2.5 // Default carbon impact in kg CO2
        }]
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests/user"] });
      toast({
        title: "Success",
        description: "Pickup request submitted successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create pickup request:", error);
      toast({
        title: "Error",
        description: "Failed to submit pickup request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total carbon saved and points
  const totalCarbonSaved = parseFloat(user?.totalCarbonSaved?.toString() || '0');
  const totalPoints = parseInt(user?.points?.toString() || '0');

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your e-waste management dashboard
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Pickup Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pickupRequests?.length || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LeafIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Carbon Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalCarbonSaved.toFixed(2)} kg</p>
                <p className="text-sm text-muted-foreground">CO₂ equivalent</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Reward Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total points earned</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Package2Icon className="h-4 w-4 mr-2" />
                  Request Pickup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Pickup Request</DialogTitle>
                  <DialogDescription>
                    Schedule a pickup for your e-waste materials. We'll handle the rest.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field: { value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Preferred Date</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={value instanceof Date ? value.toISOString().slice(0, 16) : value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Pickup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Carbon Impact</TableHead>
                      <TableHead>Points</TableHead>
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
                        <TableCell>{request.carbonSaved} kg CO₂</TableCell>
                        <TableCell>{request.pointsAwarded} pts</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <MarketplaceView />
        </TabsContent>
      </Tabs>
    </div>
  );
}