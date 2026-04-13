import { Client } from '@stomp/stompjs';
import { useEffect, useRef, useCallback } from 'react';

export type WebSocketEvent = {
  type: string;
  entityId: number | null;
  entityCode: string | null;
  timestamp: string;
  data: unknown;
};

type Subscription = {
  topic: string;
  callback: (event: WebSocketEvent) => void;
};

const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.host}/ws`
  : `ws://${window.location.host}/ws`;

export function useWebSocket(
  subscriptions: Subscription[],
  enabled = true,
): { connected: boolean } {
  const clientRef = useRef<Client | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      connectedRef.current = true;
      for (const sub of subscriptions) {
        client.subscribe(sub.topic, (message) => {
          try {
            const event = JSON.parse(message.body) as WebSocketEvent;
            sub.callback(event);
          } catch {
            // ignore malformed messages
          }
        });
      }
    };

    client.onDisconnect = () => {
      connectedRef.current = false;
    };

    client.onStompError = () => {
      connectedRef.current = false;
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      connectedRef.current = false;
    };
  }, [enabled, subscriptions.map((s) => s.topic).join(',')]);

  return { connected: connectedRef.current };
}

export function useKitchenWebSocket(onEvent: (event: WebSocketEvent) => void, enabled = true) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;
  const stableCallback = useCallback((e: WebSocketEvent) => callbackRef.current(e), []);
  const subscriptions: Subscription[] = [
    { topic: '/topic/kitchen', callback: stableCallback },
    { topic: '/topic/orders', callback: stableCallback },
  ];
  return useWebSocket(subscriptions, enabled);
}

export function useDashboardWebSocket(onEvent: (event: WebSocketEvent) => void, enabled = true) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;
  const stableCallback = useCallback((e: WebSocketEvent) => callbackRef.current(e), []);
  const subscriptions: Subscription[] = [
    { topic: '/topic/orders', callback: stableCallback },
    { topic: '/topic/reservations', callback: stableCallback },
    { topic: '/topic/tables', callback: stableCallback },
    { topic: '/topic/service-requests', callback: stableCallback },
  ];
  return useWebSocket(subscriptions, enabled);
}
