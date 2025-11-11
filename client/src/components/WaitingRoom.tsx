import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const WaitingRoom: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="text-center bg-white/10 backdrop-blur-md">
        <CardHeader>
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-500" />
          <CardTitle className="text-2xl font-bold text-white mb-4">
            🔍 Finding Opponent...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-300 text-lg">
            Waiting for another player to join
          </CardDescription>
          <p className="text-gray-400 text-sm mt-2">
            Bot will join automatically in 10 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingRoom;
