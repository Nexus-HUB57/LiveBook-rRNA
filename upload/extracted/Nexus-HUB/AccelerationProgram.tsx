/**
 * Acceleration Program Component
 * Manages startup acceleration programs with mentor agents
 * Part of Phase 15: Expansion and Scale
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { formatDate } from '@/utils/format';

interface AccelerationProgram {
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  mentorAgent?: string;
  focusArea?: string;
  status: 'planning' | 'active' | 'completed';
  participants: Participant[];
}

interface Participant {
  id: number;
  startupId: number;
  startupName: string;
  status: 'applied' | 'accepted' | 'active' | 'graduated' | 'dropped';
  mentorAgent?: string;
  progressScore: number;
  joinedAt: Date;
}

export function AccelerationProgram() {
  const [programs, setPrograms] = useState<AccelerationProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<AccelerationProgram | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual tRPC call
        // const data = await trpc.acceleration.listPrograms.query({
        //   status: filterStatus === 'all' ? undefined : filterStatus,
        // });
        // setPrograms(data);
        setPrograms([]);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, [filterStatus]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acceleration Programs</h1>
          <p className="text-gray-600 mt-2">Launch and manage startup acceleration initiatives</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">Create Program</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateProgramDialog onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">No programs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onSelect={() => setSelectedProgram(program)}
              getStatusBadgeColor={getStatusBadgeColor}
            />
          ))}
        </div>
      )}

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
}

/**
 * Program Card Component
 */
interface ProgramCardProps {
  program: AccelerationProgram;
  onSelect: () => void;
  getStatusBadgeColor: (status: string) => string;
}

function ProgramCard({ program, onSelect, getStatusBadgeColor }: ProgramCardProps) {
  const participantCount = program.participants.filter(p => p.status === 'active').length;
  const progressPercentage = (participantCount / program.maxParticipants) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{program.name}</CardTitle>
            {program.focusArea && (
              <CardDescription>{program.focusArea}</CardDescription>
            )}
          </div>
          <Badge className={getStatusBadgeColor(program.status)}>
            {program.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="text-sm text-gray-600">
          <p>{formatDate(program.startDate)} - {formatDate(program.endDate)}</p>
        </div>

        {/* Participants Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Participants</p>
            <p className="text-sm text-gray-600">{participantCount}/{program.maxParticipants}</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Description Preview */}
        {program.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Create Program Dialog Component
 */
interface CreateProgramDialogProps {
  onSuccess: () => void;
}

function CreateProgramDialog({ onSuccess }: CreateProgramDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: '10',
    focusArea: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement create program via tRPC
      // await trpc.acceleration.createProgram.mutate({
      //   name: formData.name,
      //   description: formData.description,
      //   startDate: new Date(formData.startDate),
      //   endDate: new Date(formData.endDate),
      //   maxParticipants: parseInt(formData.maxParticipants),
      //   focusArea: formData.focusArea,
      // });
      onSuccess();
    } catch (error) {
      console.error('Failed to create program:', error);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Acceleration Program</DialogTitle>
        <DialogDescription>Launch a new startup acceleration initiative</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Program Name</label>
          <Input
            placeholder="e.g., Web3 Accelerator 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            placeholder="Program description and goals"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Participants</label>
            <Input
              type="number"
              min="1"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Focus Area</label>
            <Input
              placeholder="e.g., DeFi, RWA, Sustainability"
              value={formData.focusArea}
              onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">Create Program</Button>
      </form>
    </div>
  );
}

/**
 * Program Detail Modal Component
 */
interface ProgramDetailModalProps {
  program: AccelerationProgram;
  onClose: () => void;
}

function ProgramDetailModal({ program, onClose }: ProgramDetailModalProps) {
  const [activeTab, setActiveTab] = useState('participants');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program.name}</DialogTitle>
          <DialogDescription>{program.focusArea}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <ParticipantsView program={program} />
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              {program.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{program.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-medium">{formatDate(program.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <p className="font-medium">{formatDate(program.endDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <Badge>{program.status}</Badge>
              </div>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <MetricsView program={program} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Participants View Component
 */
interface ParticipantsViewProps {
  program: AccelerationProgram;
}

function ParticipantsView({ program }: ParticipantsViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'graduated':
        return 'bg-purple-100 text-purple-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {program.participants.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No participants yet</p>
      ) : (
        program.participants.map((participant) => (
          <Card key={participant.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{participant.startupName}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(participant.status)}>
                      {participant.status}
                    </Badge>
                    {participant.mentorAgent && (
                      <Badge variant="secondary">{participant.mentorAgent}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold">{participant.progressScore}%</p>
                </div>
              </div>
              <Progress value={participant.progressScore} className="mt-3 h-2" />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

/**
 * Metrics View Component
 */
interface MetricsViewProps {
  program: AccelerationProgram;
}

function MetricsView({ program }: MetricsViewProps) {
  const totalParticipants = program.participants.length;
  const activeParticipants = program.participants.filter(p => p.status === 'active').length;
  const graduatedParticipants = program.participants.filter(p => p.status === 'graduated').length;
  const droppedParticipants = program.participants.filter(p => p.status === 'dropped').length;
  const averageProgress = totalParticipants > 0
    ? Math.round(program.participants.reduce((sum, p) => sum + p.progressScore, 0) / totalParticipants)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">Total Participants</p>
          <p className="text-3xl font-bold">{totalParticipants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600">{activeParticipants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">Graduated</p>
          <p className="text-3xl font-bold text-purple-600">{graduatedParticipants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">Dropped</p>
          <p className="text-3xl font-bold text-red-600">{droppedParticipants}</p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardContent className="py-4">
          <p className="text-sm text-gray-600 mb-2">Average Progress</p>
          <div className="flex items-center gap-4">
            <Progress value={averageProgress} className="flex-1 h-3" />
            <p className="text-2xl font-bold">{averageProgress}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
