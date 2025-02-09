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
import { CalendarIcon, Package2Icon, TicketIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function UserDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: pickupRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests/user"],
  });

  const { data: supportTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets/user"],
  });

  const form = useForm({
    resolver: zodResolver(insertPickupRequestSchema),
    defaultValues: {
      status: "PENDING",
      items: [{
        type: 'general',
        description: 'General e-waste pickup',
        quantity: 1
      }],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await apiRequest("POST", "/api/pickup-requests", {
        ...data,
        // The schema will handle the date conversion
        scheduledDate: data.scheduledDate
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2Icon className="h-5 w-5" />
              Pickup Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pickupRequests?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{supportTickets?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Request Pickup</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Pickup Request</DialogTitle>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Pickup Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Scheduled Date</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}