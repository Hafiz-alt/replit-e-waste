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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";

export default function TechnicianDashboard() {
  const { toast } = useToast();
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);

  const { data: repairRequests } = useQuery<RepairRequest[]>({
    queryKey: ["/api/repair-requests/technician"],
  });

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

  const listingForm = useForm<z.infer<typeof insertMarketplaceListingSchema>>({
    resolver: zodResolver(insertMarketplaceListingSchema),
    defaultValues: {
      images: [],
      status: 'AVAILABLE',
      condition: 'GOOD',
      isRefurbished: true,
    }
  });

  const onSubmitListing = async (data: z.infer<typeof insertMarketplaceListingSchema>) => {
    try {
      if (!selectedRepair) return;

      await apiRequest("POST", "/api/marketplace-listings", {
        ...data,
        originalRepairId: selectedRepair.id,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/marketplace-listings"] });
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
        description: "Failed to list item in marketplace",
        variant: "destructive",
      });
    }
  };

  const pendingRepairs = repairRequests?.filter((r) => r.status === "PENDING") || [];
  const inProgressRepairs = repairRequests?.filter((r) => r.status === "IN_PROGRESS") || [];
  const completedRepairs = repairRequests?.filter((r) => r.status === "COMPLETED") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Pending Repairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRepairs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgressRepairs.length}</p>
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
            <p className="text-3xl font-bold">{completedRepairs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repair Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairRequests?.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell>
                    <Badge variant={
                      repair.status === "COMPLETED" ? "default" :
                      repair.status === "IN_PROGRESS" ? "secondary" : "outline"
                    }>
                      {repair.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{repair.deviceType}</TableCell>
                  <TableCell>{repair.description}</TableCell>
                  <TableCell>
                    {repair.estimatedCost ? 
                      `$${parseFloat(repair.estimatedCost.toString()).toFixed(2)}` : 
                      'Pending'
                    }
                  </TableCell>
                  <TableCell>
                    {repair.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const cost = window.prompt("Enter estimated repair cost:");
                            if (cost && !isNaN(parseFloat(cost))) {
                              updateRepairStatus(repair.id, "IN_PROGRESS", parseFloat(cost));
                            }
                          }}
                        >
                          Start Repair
                        </Button>
                      </div>
                    )}
                    {repair.status === "IN_PROGRESS" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateRepairStatus(repair.id, "COMPLETED")}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                    {repair.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRepair(repair);
                          setListingDialogOpen(true);
                        }}
                      >
                        <StoreIcon className="h-4 w-4 mr-2" />
                        List in Marketplace
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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