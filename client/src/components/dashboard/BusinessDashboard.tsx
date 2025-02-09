import { useQuery } from "@tanstack/react-query";
import { PickupRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPickupRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BuildingIcon, TruckIcon, RecycleIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function BusinessDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: pickupRequests } = useQuery<PickupRequest[]>({
    queryKey: ["/api/pickup-requests/user"],
  });

  const form = useForm({
    resolver: zodResolver(insertPickupRequestSchema),
    defaultValues: {
      status: "PENDING",
      items: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await apiRequest("POST", "/api/pickup-requests", {
        ...data,
        isBulkRequest: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pickup-requests/user"] });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create bulk pickup request:", error);
    }
  };

  const totalItems = pickupRequests?.reduce(
    (acc, req) => acc + req.items.length,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Total Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pickupRequests?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RecycleIcon className="h-5 w-5" />
              Items Recycled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <BuildingIcon className="h-4 w-4 mr-2" />
              Request Bulk Pickup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Bulk Pickup Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Pickup Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the types and quantities of e-waste items"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Submit Request</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Pickup History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Items</TableHead>
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
                  <TableCell>{request.items.length} items</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
