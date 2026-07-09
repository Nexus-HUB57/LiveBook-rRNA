/**
 * Agent Marketplace Component
 * Allows startups to buy, sell, and rent AI agents
 * Part of Phase 15: Expansion and Scale
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { formatCurrency } from '@/utils/format';

interface Agent {
  id: number;
  name: string;
  specialization: string;
  role: string;
  reputation: number;
  health: number;
  energy: number;
  creativity: number;
}

interface MarketplaceListing {
  id: number;
  agent: Agent;
  ownerStartup: string;
  listingType: 'sale' | 'rental' | 'partnership';
  price: number;
  rentalPeriodDays?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

interface Transaction {
  id: number;
  agent: Agent;
  from: string;
  to: string;
  transactionType: 'sale' | 'rental_start' | 'rental_end';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export function AgentMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'rental' | 'partnership'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch listings on component mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual tRPC call
        // const data = await trpc.agentMarketplace.listAgents.query({ listingType: filterType === 'all' ? undefined : filterType });
        // setListings(data);
        setListings([]);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [filterType]);

  const handlePurchaseAgent = async (listing: MarketplaceListing) => {
    try {
      // TODO: Implement purchase logic via tRPC
      // await trpc.agentMarketplace.purchaseAgent.mutate({
      //   listingId: listing.id,
      //   buyerStartupId: currentStartupId,
      //   rentalDays: listing.listingType === 'rental' ? listing.rentalPeriodDays : undefined,
      // });
      console.log('Agent purchased:', listing.agent.name);
    } catch (error) {
      console.error('Failed to purchase agent:', error);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesType = filterType === 'all' || listing.listingType === filterType;
    const matchesSearch = listing.agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.agent.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Marketplace</h1>
          <p className="text-gray-600 mt-2">Buy, sell, and rent specialized AI agents</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">Create Listing</Button>
          </DialogTrigger>
          <DialogContent>
            <CreateListingDialog onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search agents by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rental">For Rent</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings">Available Listings</TabsTrigger>
          <TabsTrigger value="my-listings">My Listings</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        {/* Available Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">No listings found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <AgentListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={() => setSelectedListing(listing)}
                  onPurchase={() => handlePurchaseAgent(listing)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Listings Tab */}
        <TabsContent value="my-listings" className="space-y-4">
          <MyListingsView />
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionHistoryView transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onPurchase={() => {
            handlePurchaseAgent(selectedListing);
            setSelectedListing(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Agent Listing Card Component
 */
interface AgentListingCardProps {
  listing: MarketplaceListing;
  onSelect: () => void;
  onPurchase: () => void;
}

function AgentListingCard({ listing, onSelect, onPurchase }: AgentListingCardProps) {
  const getListingTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'rental':
        return 'bg-blue-100 text-blue-800';
      case 'partnership':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{listing.agent.name}</CardTitle>
            <CardDescription>{listing.agent.specialization}</CardDescription>
          </div>
          <Badge className={getListingTypeBadgeColor(listing.listingType)}>
            {listing.listingType === 'sale' ? 'For Sale' : listing.listingType === 'rental' ? 'For Rent' : 'Partnership'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Agent Stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Health</p>
            <p className="font-semibold">{listing.agent.health}%</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Energy</p>
            <p className="font-semibold">{listing.agent.energy}%</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Creativity</p>
            <p className="font-semibold">{listing.agent.creativity}%</p>
          </div>
        </div>

        {/* Price */}
        <div className="border-t pt-3">
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-2xl font-bold">{formatCurrency(listing.price)}</p>
          {listing.listingType === 'rental' && listing.rentalPeriodDays && (
            <p className="text-sm text-gray-500">per {listing.rentalPeriodDays} days</p>
          )}
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onPurchase();
          }}
        >
          {listing.listingType === 'sale' ? 'Buy Now' : listing.listingType === 'rental' ? 'Rent Now' : 'Partner'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Create Listing Dialog Component
 */
interface CreateListingDialogProps {
  onSuccess: () => void;
}

function CreateListingDialog({ onSuccess }: CreateListingDialogProps) {
  const [formData, setFormData] = useState({
    agentId: '',
    listingType: 'sale' as const,
    price: '',
    rentalPeriodDays: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement create listing via tRPC
      // await trpc.agentMarketplace.createListing.mutate({
      //   agentId: parseInt(formData.agentId),
      //   ownerStartupId: currentStartupId,
      //   listingType: formData.listingType,
      //   price: formData.price,
      //   rentalPeriodDays: formData.listingType === 'rental' ? parseInt(formData.rentalPeriodDays) : undefined,
      //   description: formData.description,
      // });
      onSuccess();
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Agent Listing</DialogTitle>
        <DialogDescription>List your AI agent for sale, rental, or partnership</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields would go here */}
        <Button type="submit" className="w-full">Create Listing</Button>
      </form>
    </div>
  );
}

/**
 * My Listings View Component
 */
function MyListingsView() {
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);

  return (
    <div className="space-y-4">
      {myListings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">You don't have any active listings</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {myListings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle>{listing.agent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Status: {listing.isActive ? 'Active' : 'Inactive'}</p>
                <p className="text-lg font-bold mt-2">{formatCurrency(listing.price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Transaction History View Component
 */
interface TransactionHistoryViewProps {
  transactions: Transaction[];
}

function TransactionHistoryView({ transactions }: TransactionHistoryViewProps) {
  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">No transactions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tx.agent.name}</p>
                    <p className="text-sm text-gray-600">{tx.from} → {tx.to}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(tx.amount)}</p>
                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Listing Detail Modal Component
 */
interface ListingDetailModalProps {
  listing: MarketplaceListing;
  onClose: () => void;
  onPurchase: () => void;
}

function ListingDetailModal({ listing, onClose, onPurchase }: ListingDetailModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{listing.agent.name}</DialogTitle>
          <DialogDescription>{listing.agent.specialization}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold">{listing.agent.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reputation</p>
              <p className="font-semibold">{listing.agent.reputation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Health</p>
              <p className="font-semibold">{listing.agent.health}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Energy</p>
              <p className="font-semibold">{listing.agent.energy}%</p>
            </div>
          </div>

          {/* Listing Info */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-3xl font-bold">{formatCurrency(listing.price)}</p>
            {listing.description && (
              <p className="text-gray-700 mt-4">{listing.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={onPurchase} className="flex-1">
              {listing.listingType === 'sale' ? 'Buy Now' : listing.listingType === 'rental' ? 'Rent Now' : 'Partner'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
