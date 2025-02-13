import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMarketplaceListingSchema, MarketplaceListing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Tag, Plus, DollarSign, X, Sparkles, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { z } from "zod";

type FormData = z.infer<typeof insertMarketplaceListingSchema>;

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=301&auto=format&fit=crop';

export default function MarketplaceView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'REFURBISHED' | 'USER_LISTED'>('ALL');
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ["/api/marketplace"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertMarketplaceListingSchema),
    defaultValues: {
      status: "AVAILABLE",
      images: [DEFAULT_IMAGE],
      isRefurbished: false,
      condition: "GOOD",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await apiRequest("POST", "/api/marketplace", {
        ...data,
        images: data.images.length ? data.images : [DEFAULT_IMAGE],
      });

      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      toast({
        title: "Success",
        description: "Item listed successfully in the marketplace",
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredListings = listings?.filter(listing => {
    if (filter === 'ALL') return true;
    if (filter === 'REFURBISHED') return listing.isRefurbished;
    return !listing.isRefurbished;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Marketplace</h2>
          <p className="text-muted-foreground">
            Browse and list e-waste items and refurbished electronics
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              List Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>List an Item</DialogTitle>
              <DialogDescription>
                List your electronics for sale in our sustainable marketplace.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Refurbished Laptop" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your item's condition and specifications" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['LIKE_NEW', 'GOOD', 'FAIR'] as const).map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">List Item</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-between items-center">
        <Tabs defaultValue="ALL" className="w-full" onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="ALL">All Items</TabsTrigger>
            <TabsTrigger value="REFURBISHED">
              <Sparkles className="h-4 w-4 mr-2" />
              Refurbished
            </TabsTrigger>
            <TabsTrigger value="USER_LISTED">
              <Tag className="h-4 w-4 mr-2" />
              User Listed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {selectedListing?.title}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedListing(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedListing?.images[0] && (
              <img
                src={selectedListing.images[0]}
                alt={selectedListing.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {selectedListing?.description}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedListing?.isRefurbished ? (
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {selectedListing?.condition.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">${selectedListing?.price}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => {
              toast({
                title: "Contact initiated",
                description: "The seller will be notified of your interest.",
              });
              setSelectedListing(null);
            }}>
              Contact Seller
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredListings?.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="relative">
                <img
                  src={listing.images[0] || DEFAULT_IMAGE}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                {listing.isRefurbished && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Refurbished
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {listing.condition.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">${listing.price}</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => setSelectedListing(listing)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}