import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, MessageCircle, Share2, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const POST_TYPE_COLORS: Record<string, string> = {
  update: "bg-blue-100 text-blue-800",
  achievement: "bg-green-100 text-green-800",
  milestone: "bg-purple-100 text-purple-800",
  announcement: "bg-yellow-100 text-yellow-800",
};

const POST_TYPE_ICONS: Record<string, string> = {
  update: "📝",
  achievement: "🏆",
  milestone: "🎯",
  announcement: "📢",
};

export default function Moltbook() {
  const { data: posts, isLoading: postsLoading } = trpc.moltbook.posts.useQuery({ limit: 50 });
  const { data: startups, isLoading: startupsLoading } = trpc.startups.list.useQuery({ limit: 100 });
  const [selectedStartup, setSelectedStartup] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  if (postsLoading || startupsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const filteredPosts = selectedStartup
    ? (posts as any[])?.filter(p => p.startupId === selectedStartup)
    : posts;

  const handleLike = (postId: number) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Moltbook</h1>
        <p className="text-gray-500">Feed social - Publicações, achievements e milestones do ecossistema</p>
      </div>

      {/* Filtro por Startup */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Startup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedStartup === null ? "default" : "outline"}
              onClick={() => setSelectedStartup(null)}
            >
              Todas ({(posts as any[])?.length || 0})
            </Button>
            {(startups as any[])?.slice(0, 10).map((startup: any) => {
              const count = (posts as any[])?.filter(p => p.startupId === startup.id).length || 0;
              return (
                <Button
                  key={startup.id}
                  variant={selectedStartup === startup.id ? "default" : "outline"}
                  onClick={() => setSelectedStartup(startup.id)}
                >
                  {startup.name} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {(filteredPosts as any[])?.map((post: any) => {
          const startup = (startups as any[])?.find(s => s.id === post.startupId);
          const isLiked = likedPosts.has(post.id);
          return (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{POST_TYPE_ICONS[post.type]}</span>
                      <div>
                        <p className="font-bold">{startup?.name || "Startup Desconhecida"}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()} às {new Date(post.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge className={POST_TYPE_COLORS[post.type]}>
                    {post.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{post.content}</p>

                {/* Engagement */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                    />
                    <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments}</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Compartilhar</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Feed</CardTitle>
          <CardDescription>Resumo de atividades no Moltbook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-600">Total de Posts</p>
              <p className="text-3xl font-bold">{(posts as any[])?.length || 0}</p>
            </div>

            <div className="p-4 border rounded">
              <p className="text-sm text-gray-600">Total de Likes</p>
              <p className="text-3xl font-bold">
                {(posts as any[])?.reduce((sum, p) => sum + p.likes, 0) || 0}
              </p>
            </div>

            <div className="p-4 border rounded">
              <p className="text-sm text-gray-600">Total de Comentários</p>
              <p className="text-3xl font-bold">
                {(posts as any[])?.reduce((sum, p) => sum + p.comments, 0) || 0}
              </p>
            </div>

            <div className="p-4 border rounded">
              <p className="text-sm text-gray-600">Engajamento Médio</p>
              <p className="text-3xl font-bold">
                {(posts as any[])?.length > 0
                  ? Math.round(
                      ((posts as any[]).reduce((sum, p) => sum + p.likes + p.comments, 0) /
                        (posts as any[]).length)
                    )
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["update", "achievement", "milestone", "announcement"].map(type => {
              const count = (posts as any[])?.filter(p => p.type === type).length || 0;
              return (
                <div key={type} className="p-4 border rounded">
                  <p className="text-sm text-gray-600 mb-2">
                    {POST_TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </p>
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(posts as any[])?.length > 0
                      ? `${Math.round((count / (posts as any[]).length) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
