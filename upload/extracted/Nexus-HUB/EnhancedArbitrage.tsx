/**
 * Enhanced Arbitrage Component
 * ML-powered arbitrage prediction and execution
 * Part of Phase 15: Expansion and Scale
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trpc } from '@/utils/trpc';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface MLModel {
  id: number;
  modelName: string;
  modelVersion: string;
  modelType: 'neural_network' | 'random_forest' | 'gradient_boosting' | 'ensemble';
  accuracy: number;
  trainingDate: Date;
  isActive: boolean;
}

interface Prediction {
  id: number;
  modelId: number;
  asset: string;
  predictedProfitPotential: number;
  confidence: number;
  predictedAt: Date;
  actualProfit?: number;
  isAccurate?: boolean;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
}

export function EnhancedArbitrage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual tRPC call
        // const data = await trpc.enhancedArbitrage.listModels.query();
        // setModels(data);
        setModels([]);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Fetch metrics when model is selected
  useEffect(() => {
    if (selectedModel) {
      const fetchMetrics = async () => {
        try {
          // TODO: Replace with actual tRPC call
          // const metrics = await trpc.enhancedArbitrage.getModelMetrics.query({ modelId: selectedModel.id });
          // setModelMetrics(metrics);
        } catch (error) {
          console.error('Failed to fetch metrics:', error);
        }
      };

      fetchMetrics();
    }
  }, [selectedModel]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Arbitrage</h1>
          <p className="text-gray-600 mt-2">ML-powered arbitrage prediction and execution</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">Train New Model</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <TrainModelDialog onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
        </TabsList>

        {/* ML Models Tab */}
        <TabsContent value="models" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading models...</p>
            </div>
          ) : models.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">No ML models trained yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={() => setSelectedModel(model)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {selectedModel ? (
            <PredictionsView model={selectedModel} predictions={predictions} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">Select a model to view predictions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {selectedModel && modelMetrics ? (
            <PerformanceView model={selectedModel} metrics={modelMetrics} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">Select a model to view performance metrics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution" className="space-y-4">
          <ExecutionView predictions={predictions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Model Card Component
 */
interface ModelCardProps {
  model: MLModel;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const getModelTypeColor = (type: string) => {
    switch (type) {
      case 'neural_network':
        return 'bg-blue-100 text-blue-800';
      case 'random_forest':
        return 'bg-green-100 text-green-800';
      case 'gradient_boosting':
        return 'bg-purple-100 text-purple-800';
      case 'ensemble':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{model.modelName}</CardTitle>
            <CardDescription>v{model.modelVersion}</CardDescription>
          </div>
          {model.isActive && (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model Type */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Model Type</p>
          <Badge className={getModelTypeColor(model.modelType)}>
            {model.modelType.replace('_', ' ')}
          </Badge>
        </div>

        {/* Accuracy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Accuracy</p>
            <p className="text-sm font-bold">{formatPercentage(model.accuracy)}</p>
          </div>
          <Progress value={model.accuracy * 100} className="h-2" />
        </div>

        {/* Training Date */}
        <p className="text-xs text-gray-500">
          Trained: {new Date(model.trainingDate).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Train Model Dialog Component
 */
interface TrainModelDialogProps {
  onSuccess: () => void;
}

function TrainModelDialog({ onSuccess }: TrainModelDialogProps) {
  const [formData, setFormData] = useState({
    modelName: '',
    modelType: 'ensemble' as const,
    trainingDataPath: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement train model via tRPC
      // await trpc.enhancedArbitrage.trainModel.mutate({
      //   modelName: formData.modelName,
      //   modelType: formData.modelType,
      //   trainingDataPath: formData.trainingDataPath,
      // });
      onSuccess();
    } catch (error) {
      console.error('Failed to train model:', error);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Train New ML Model</DialogTitle>
        <DialogDescription>Create a new machine learning model for arbitrage prediction</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Model Name</label>
          <Input
            placeholder="e.g., Arbitrage Predictor v2"
            value={formData.modelName}
            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Model Type</label>
          <Select value={formData.modelType} onValueChange={(value: any) => setFormData({ ...formData, modelType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neural_network">Neural Network</SelectItem>
              <SelectItem value="random_forest">Random Forest</SelectItem>
              <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
              <SelectItem value="ensemble">Ensemble</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Training Data Path</label>
          <Input
            placeholder="/path/to/training/data.csv"
            value={formData.trainingDataPath}
            onChange={(e) => setFormData({ ...formData, trainingDataPath: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full">Start Training</Button>
      </form>
    </div>
  );
}

/**
 * Predictions View Component
 */
interface PredictionsViewProps {
  model: MLModel;
  predictions: Prediction[];
}

function PredictionsView({ model, predictions }: PredictionsViewProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [newPredictionAsset, setNewPredictionAsset] = useState('');

  const handleMakePrediction = async () => {
    if (!newPredictionAsset.trim()) return;
    try {
      // TODO: Implement make prediction via tRPC
      // await trpc.enhancedArbitrage.makePrediction.mutate({
      //   modelId: model.id,
      //   asset: newPredictionAsset,
      // });
      setNewPredictionAsset('');
    } catch (error) {
      console.error('Failed to make prediction:', error);
    }
  };

  const filteredPredictions = selectedAsset
    ? predictions.filter(p => p.asset === selectedAsset)
    : predictions;

  return (
    <div className="space-y-4">
      {/* Make Prediction */}
      <Card>
        <CardHeader>
          <CardTitle>Make Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter asset symbol (e.g., BTC, ETH)"
              value={newPredictionAsset}
              onChange={(e) => setNewPredictionAsset(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMakePrediction()}
            />
            <Button onClick={handleMakePrediction}>Predict</Button>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      {predictions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">No predictions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPredictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Prediction Card Component
 */
interface PredictionCardProps {
  prediction: Prediction;
}

function PredictionCard({ prediction }: PredictionCardProps) {
  const getAccuracyColor = (isAccurate?: boolean) => {
    if (isAccurate === undefined) return 'text-gray-600';
    return isAccurate ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold">{prediction.asset}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                Confidence: {formatPercentage(prediction.confidence)}
              </Badge>
              {prediction.isAccurate !== undefined && (
                <Badge className={getAccuracyColor(prediction.isAccurate)}>
                  {prediction.isAccurate ? 'Accurate' : 'Inaccurate'}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Predicted Profit</p>
            <p className="text-2xl font-bold">{formatCurrency(prediction.predictedProfitPotential)}</p>
            {prediction.actualProfit !== undefined && (
              <p className="text-sm text-gray-600 mt-1">
                Actual: {formatCurrency(prediction.actualProfit)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Performance View Component
 */
interface PerformanceViewProps {
  model: MLModel;
  metrics: ModelMetrics;
}

function PerformanceView({ model, metrics }: PerformanceViewProps) {
  const performanceData = [
    { metric: 'Accuracy', value: metrics.accuracy * 100 },
    { metric: 'Precision', value: metrics.precision * 100 },
    { metric: 'Recall', value: metrics.recall * 100 },
    { metric: 'F1 Score', value: metrics.f1Score * 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">Accuracy</p>
            <p className="text-3xl font-bold">{formatPercentage(metrics.accuracy)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">Precision</p>
            <p className="text-3xl font-bold">{formatPercentage(metrics.precision)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">Recall</p>
            <p className="text-3xl font-bold">{formatPercentage(metrics.recall)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">F1 Score</p>
            <p className="text-3xl font-bold">{formatPercentage(metrics.f1Score)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Prediction Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold">{metrics.totalPredictions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Correct Predictions</p>
              <p className="text-2xl font-bold text-green-600">{metrics.correctPredictions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Execution View Component
 */
interface ExecutionViewProps {
  predictions: Prediction[];
}

function ExecutionView({ predictions }: ExecutionViewProps) {
  const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>High Confidence Opportunities</CardTitle>
          <CardDescription>Predictions with >80% confidence</CardDescription>
        </CardHeader>
        <CardContent>
          {highConfidencePredictions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No high confidence predictions</p>
          ) : (
            <div className="space-y-2">
              {highConfidencePredictions.map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{prediction.asset}</p>
                    <p className="text-sm text-gray-600">
                      Confidence: {formatPercentage(prediction.confidence)}
                    </p>
                  </div>
                  <Button size="sm">Execute</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
