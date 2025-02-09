import { useQuery } from "@tanstack/react-query";
import { RepairRequest, type InsertMarketplaceListing, insertMarketplaceListingSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WrenchIcon, CheckCircle2Icon, ClockIcon, StoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

export default function TechnicianDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [pickupDetailsOpen, setPickupDetailsOpen] = useState(false);

  const { data: availableRepairRequests } = useQuery<RepairRequest[]>({
    queryKey: ["/api/repair-requests/available"],
    enabled: !!user?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new requests
  });

  const { data: myRepairRequests } = useQuery<RepairRequest[]>({
    queryKey: ["/api/repair-requests/technician"],
    enabled: !!user?.id,
  });

  const listingForm = useForm<z.infer<typeof insertMarketplaceListingSchema>>({
    resolver: zodResolver(insertMarketplaceListingSchema),
    defaultValues: {
      status: 'AVAILABLE',
      condition: 'GOOD',
      isRefurbished: true,
    }
  });

  const onSubmitListing = async (data: z.infer<typeof insertMarketplaceListingSchema>) => {
    try {
      if (!selectedRepair || !user) return;

      await apiRequest("POST", "/api/marketplace/listings", {
        ...data,
        sellerId: user.id,
        originalRepairId: selectedRepair.id,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });

      toast({
        title: "Success",
        description: "Item listed successfully in the marketplace",
      });

      setListingDialogOpen(false);
      listingForm.reset();
    } catch (error) {
      console.error("Failed to create marketplace listing:", error);
      toast({
        title: "Error",
        description: "Failed to create marketplace listing",
        variant: "destructive",
      });
    }
  };

  const acceptRepairRequest = async (repairId: number) => {
    setSelectedRepair(availableRepairRequests?.find(r => r.id === repairId) || null);
    setPickupDetailsOpen(true);
  };

  const submitPickupDetails = async (data: any) => {
    try {
      if (!selectedRepair) return;

      await apiRequest("PATCH", `/api/repair-requests/${selectedRepair.id}/accept`, {
        technicianId: user?.id,
        status: "ACCEPTED",
        pickupDate: data.pickupDate,
        pickupAddress: data.pickupAddress,
        technicianPhone: data.technicianPhone,
        technicianEmail: data.technicianEmail,
        pickupNotes: data.pickupNotes
      });

      queryClient.invalidateQueries({ queryKey: ["/api/repair-requests/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-requests/technician"] });

      toast({
        title: "Success",
        description: "Repair request accepted and contact details shared",
      });

      setPickupDetailsOpen(false);
    } catch (error) {
      console.error("Failed to accept repair request:", error);
      toast({
        title: "Error",
        description: "Failed to accept repair request",
        variant: "destructive",
      });
    }
  };

  const updateRepairStatus = async (id: number, status: string, estimatedCost?: number) => {
    try {
      await apiRequest("PATCH", `/api/repair-requests/${id}/status`, { 
        status,
        estimatedCost
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-requests/technician"] });
      toast({
        title: "Status Updated",
        description: `Repair request status updated to ${status}`,
      });
    } catch (error) {
      console.error("Failed to update repair status:", error);
      toast({
        title: "Error",
        description: "Failed to update repair status",
        variant: "destructive",
      });
    }
  };

  const pickupForm = useForm({
    defaultValues: {
      pickupDate: new Date().toISOString().split('T')[0],
      pickupAddress: "",
      technicianPhone: "",
      technicianEmail: "",
      pickupNotes: ""
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Available Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{availableRepairRequests?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              My Active Repairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {myRepairRequests?.filter(r => r.status === "IN_PROGRESS").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {myRepairRequests?.filter(r => r.status === "COMPLETED").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Repair Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableRepairRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.deviceType}</TableCell>
                  <TableCell>{request.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => acceptRepairRequest(request.id)}
                    >
                      Accept Request
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Repair Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRepairRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.deviceType}</TableCell>
                  <TableCell>{request.description}</TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === "COMPLETED" ? "default" :
                      request.status === "IN_PROGRESS" ? "secondary" : "outline"
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.pickupDate ? new Date(request.pickupDate).toLocaleDateString() : 'Not scheduled'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === "ACCEPTED" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const cost = window.prompt("Enter estimated repair cost:");
                            if (cost && !isNaN(parseFloat(cost))) {
                              updateRepairStatus(request.id, "IN_PROGRESS", parseFloat(cost));
                            }
                          }}
                        >
                          Start Repair
                        </Button>
                      )}
                      {request.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          onClick={() => updateRepairStatus(request.id, "COMPLETED")}
                        >
                          Complete
                        </Button>
                      )}
                      {request.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRepair(request);
                            setListingDialogOpen(true);
                          }}
                        >
                          <StoreIcon className="h-4 w-4 mr-2" />
                          List in Marketplace
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={pickupDetailsOpen} onOpenChange={setPickupDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Pickup & Share Contact Details</DialogTitle>
            <DialogDescription>
              Set pickup details and provide your contact information for the customer
            </DialogDescription>
          </DialogHeader>
          <Form {...pickupForm}>
            <form onSubmit={pickupForm.handleSubmit(submitPickupDetails)} className="space-y-4">
              <FormField
                control={pickupForm.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pickupForm.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter pickup address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pickupForm.control}
                name="technicianPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your phone number" type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pickupForm.control}
                name="technicianEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pickupForm.control}
                name="pickupNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Any additional instructions for pickup" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Confirm & Share Details</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={listingDialogOpen} onOpenChange={setListingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List Refurbished Item</DialogTitle>
            <DialogDescription>
              Create a marketplace listing for this refurbished device.
            </DialogDescription>
          </DialogHeader>
          <Form {...listingForm}>
            <form onSubmit={listingForm.handleSubmit(onSubmitListing)} className="space-y-4">
              <FormField
                control={listingForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Refurbished Laptop" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={listingForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the item's condition and specifications" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={listingForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={listingForm.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="LIKE_NEW">Like New</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Create Listing</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}