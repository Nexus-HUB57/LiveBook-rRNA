/**
 * Soul Vault Zettlekasten Component
 * Enhanced knowledge management system with linking and relationships
 * Part of Phase 15: Expansion and Scale
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';

interface ZettleEntry {
  id: number;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

interface ZettleLink {
  id: number;
  fromEntryId: number;
  toEntryId: number;
  linkType: 'related' | 'contradicts' | 'builds_on' | 'references' | 'inspired_by';
  description?: string;
}

interface KnowledgeGraphNode {
  id: number;
  title: string;
  importance: string;
  category?: string;
}

interface KnowledgeGraphEdge {
  source: number;
  target: number;
  type: string;
}

export function SoulVaultZettlekasten() {
  const [entries, setEntries] = useState<ZettleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ZettleEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeGraph, setKnowledgeGraph] = useState<{ nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }>({
    nodes: [],
    edges: [],
  });

  // Fetch entries on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual tRPC call
        // const data = await trpc.soulVaultZettlekasten.listEntries.query({
        //   category: filterCategory === 'all' ? undefined : filterCategory,
        //   importance: filterImportance === 'all' ? undefined : filterImportance,
        // });
        // setEntries(data);
        setEntries([]);
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [filterCategory, filterImportance]);

  // Fetch knowledge graph
  useEffect(() => {
    const fetchKnowledgeGraph = async () => {
      try {
        // TODO: Replace with actual tRPC call
        // const graph = await trpc.soulVaultZettlekasten.getKnowledgeGraph.query();
        // setKnowledgeGraph(graph);
      } catch (error) {
        console.error('Failed to fetch knowledge graph:', error);
      }
    };

    fetchKnowledgeGraph();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }
    try {
      // TODO: Replace with actual tRPC call
      // const results = await trpc.soulVaultZettlekasten.search.query({ query });
      // setEntries(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Soul Vault Zettlekasten</h1>
          <p className="text-gray-600 mt-2">Knowledge management system with interconnected insights</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">Create Entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateEntryDialog onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="decision">Decisions</SelectItem>
                    <SelectItem value="precedent">Precedents</SelectItem>
                    <SelectItem value="lesson">Lessons</SelectItem>
                    <SelectItem value="insight">Insights</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterImportance} onValueChange={setFilterImportance}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Entries Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">No entries found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onSelect={() => setSelectedEntry(entry)}
                  getImportanceBadgeColor={getImportanceBadgeColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          <KnowledgeGraphView graph={knowledgeGraph} />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <SearchView onSearch={handleSearch} />
        </TabsContent>
      </Tabs>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onCreateLink={() => {}}
        />
      )}
    </div>
  );
}

/**
 * Entry Card Component
 */
interface EntryCardProps {
  entry: ZettleEntry;
  onSelect: () => void;
  getImportanceBadgeColor: (importance: string) => string;
}

function EntryCard({ entry, onSelect, getImportanceBadgeColor }: EntryCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{entry.title}</CardTitle>
          <Badge className={getImportanceBadgeColor(entry.importance)}>
            {entry.importance}
          </Badge>
        </div>
        {entry.category && (
          <CardDescription>{entry.category}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-3">{entry.content}</p>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{entry.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Create Entry Dialog Component
 */
interface CreateEntryDialogProps {
  onSuccess: () => void;
}

function CreateEntryDialog({ onSuccess }: CreateEntryDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: '',
    importance: 'medium' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement create entry via tRPC
      // await trpc.soulVaultZettlekasten.createEntry.mutate({
      //   title: formData.title,
      //   content: formData.content,
      //   tags: formData.tags.split(',').map(t => t.trim()),
      //   category: formData.category,
      //   importance: formData.importance,
      // });
      onSuccess();
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Zettlekasten Entry</DialogTitle>
        <DialogDescription>Add a new entry to your knowledge vault</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            placeholder="Entry title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <Textarea
            placeholder="Entry content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Input
              placeholder="e.g., Decision, Lesson"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Importance</label>
            <Select value={formData.importance} onValueChange={(value: any) => setFormData({ ...formData, importance: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <Input
            placeholder="e.g., governance, finance, innovation"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full">Create Entry</Button>
      </form>
    </div>
  );
}

/**
 * Entry Detail Modal Component
 */
interface EntryDetailModalProps {
  entry: ZettleEntry;
  onClose: () => void;
  onCreateLink: () => void;
}

function EntryDetailModal({ entry, onClose, onCreateLink }: EntryDetailModalProps) {
  const [relatedEntries, setRelatedEntries] = useState<ZettleEntry[]>([]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry.title}</DialogTitle>
          {entry.category && (
            <DialogDescription>{entry.category}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Content */}
          <div>
            <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Importance</p>
              <Badge className="mt-1">{entry.importance}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="mt-1 font-medium">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Entries */}
          {relatedEntries.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Related Entries</p>
              <div className="space-y-2">
                {relatedEntries.map((related) => (
                  <div key={related.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm">{related.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
            <Button onClick={onCreateLink} className="flex-1">Create Link</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Knowledge Graph View Component
 */
interface KnowledgeGraphViewProps {
  graph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };
}

function KnowledgeGraphView({ graph }: KnowledgeGraphViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Graph</CardTitle>
        <CardDescription>Visualization of interconnected entries and relationships</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Knowledge graph visualization would be rendered here
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Nodes: {graph.nodes.length} | Edges: {graph.edges.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Search View Component
 */
interface SearchViewProps {
  onSearch: (query: string) => void;
}

function SearchView({ onSearch }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ZettleEntry[]>([]);

  const handleSearch = async () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search entries by content, title, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="py-4">
                <p className="font-semibold">{entry.title}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
