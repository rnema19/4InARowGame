import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UsernameInputProps {
  onSubmit: (username: string) => void;
  isConnected: boolean;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ onSubmit, isConnected }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/10 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-white mb-2">
            🎮 4 in a Row
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            Multiplayer Connect Four Game
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-white" />
              <p className="text-white">Connecting to server...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-semibold">
                  Enter Your Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter at least 3 characters"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  minLength={3}
                  maxLength={20}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={username.trim().length < 3}
              >
                🚀 Start Playing
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/20">
            <h3 className="text-white font-semibold mb-3">How to Play:</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Connect 4 discs in a row to win</li>
              <li>• Play against other players or bot</li>
              <li>• If no opponent joins in 10s, bot plays</li>
              <li>• Click a column to drop your disc</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsernameInput;
