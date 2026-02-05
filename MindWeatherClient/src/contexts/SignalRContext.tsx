import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import type { EmotionResponse } from '../types/emotion';

interface SignalRContextType {
    connection: signalR.HubConnection | null;
    latestEmotion: EmotionResponse | null;
    isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType>({
    connection: null,
    latestEmotion: null,
    isConnected: false,
});

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }: { children: ReactNode }) => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [latestEmotion, setLatestEmotion] = useState<EmotionResponse | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5015/api';
        // Remove '/api' from the end and append '/emotionHub'
        const hubUrl = apiUrl.replace(/\/api$/, '') + '/emotionHub';

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR Hub');
                    setIsConnected(true);

                    connection.on('ReceiveEmotion', (emotion: EmotionResponse) => {
                        console.log('New Emotion Received:', emotion);
                        setLatestEmotion(emotion);
                        // Reset after a short delay to allow re-triggering for same-data events if needed
                        // But usually we just want the stream.
                    });
                })
                .catch(err => console.error('Connection failed: ', err));

            return () => {
                connection.off('ReceiveEmotion');
                connection.stop();
            };
        }
    }, [connection]);

    return (
        <SignalRContext.Provider value={{ connection, latestEmotion, isConnected }}>
            {children}
        </SignalRContext.Provider>
    );
};
