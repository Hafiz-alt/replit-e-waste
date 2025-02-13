import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        switch (type) {
          case 'REPAIR_STATUS_UPDATE':
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/repair-requests/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/repair-requests/technician'] });
            
            // Show toast notification
            toast({
              title: 'Repair Status Updated',
              description: `Status changed to: ${data.status}`,
            });
            break;

          case 'NEW_REPAIR_REQUEST':
            if (user.role === 'TECHNICIAN') {
              queryClient.invalidateQueries({ queryKey: ['/api/repair-requests/available'] });
              toast({
                title: 'New Repair Request',
                description: `New repair request for ${data.deviceType}`,
              });
            }
            break;

          default:
            console.log('Unknown message type:', type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates',
        variant: 'destructive',
      });
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    }
  }, [socket]);

  return { sendMessage };
}
