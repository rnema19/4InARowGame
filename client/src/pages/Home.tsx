import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Bot, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Leaderboard from '@/components/Leaderboard';
import { useWebSocket } from '@/hooks/useWebSocket';

function Home() {
  const navigate = useNavigate();
  const { sendMessage, lastMessage } = useWebSocket();

  const handlePlayNow = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            🎮 Connect Four
          </h1>
          <p className="text-xl text-white/90">
            Classic multiplayer board game - Connect 4 discs in a row to win!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Play Section */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <Play className="w-8 h-8" />
                Start Playing
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Jump into a game and challenge opponents!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handlePlayNow}
                size="lg"
                className="w-full text-xl py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Users className="w-6 h-6 mr-2" />
                Play Now
              </Button>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-6 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                    <h3 className="text-white font-semibold mb-1">1v1 Multiplayer</h3>
                    <p className="text-white/70 text-sm">Play against real players</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-6 text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <h3 className="text-white font-semibold mb-1">Bot Match</h3>
                    <p className="text-white/70 text-sm">Auto-match after 10s</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <Trophy className="w-8 h-8" />
                Game Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-white">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Real-time Multiplayer</p>
                    <p className="text-white/70 text-sm">Instant WebSocket connections</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Smart AI Opponent</p>
                    <p className="text-white/70 text-sm">Minimax algorithm bot with alpha-beta pruning</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Reconnect Feature</p>
                    <p className="text-white/70 text-sm">30-second grace period to rejoin</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Global Leaderboard</p>
                    <p className="text-white/70 text-sm">Track your wins and compete</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Auto-Matchmaking</p>
                    <p className="text-white/70 text-sm">Find opponents or play with bot</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <Leaderboard sendMessage={sendMessage} lastMessage={lastMessage} />
        </div>

        {/* Footer */}
        <div className="text-center text-white/70 pb-8">
          <p>Built with React, TypeScript, Node.js, WebSocket, and PostgreSQL</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
