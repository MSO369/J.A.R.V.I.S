
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { MicrophoneIcon, StopCircleIcon } from '../icons/HeroIcons';
import { encode, decode, decodeAudioData } from '../../utils/helpers';

// Augment the global window object
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const LiveConvoPanel: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<{ user: string, model: string }[]>([]);
  const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopConversation = useCallback(async () => {
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
        sessionPromiseRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    
    setIsLive(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);
  
  const startConversation = async () => {
    if (isLive) return;
    setIsLive(true);
    setError(null);
    setTranscription([]);
    setCurrentTurn({ user: '', model: '' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are J.A.R.V.I.S., a futuristic and helpful AI assistant. Be concise and professional.',
        },
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setCurrentTurn(prev => ({...prev, user: prev.user + message.serverContent!.inputTranscription!.text}));
            }
            if (message.serverContent?.outputTranscription) {
              setCurrentTurn(prev => ({...prev, model: prev.model + message.serverContent!.outputTranscription!.text}));
            }
            if (message.serverContent?.turnComplete) {
              setTranscription(prev => [...prev, currentTurn]);
              setCurrentTurn({ user: '', model: '' });
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const outputCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => source.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setError('An error occurred during the session.');
            stopConversation();
          },
          onclose: () => {
            stopConversation();
          },
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Could not access microphone. Please grant permission and try again.');
      setIsLive(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-6">Live Conversation</h2>
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={isLive ? stopConversation : startConversation}
          className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
            isLive ? 'bg-red-500/30' : 'bg-cyan-500/30'
          }`}
        >
          <div className={`absolute animate-ping w-full h-full rounded-full ${isLive ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
          <div className="relative z-10 text-white">
            {isLive ? <StopCircleIcon className="w-12 h-12" /> : <MicrophoneIcon className="w-12 h-12" />}
          </div>
        </button>
      </div>
       {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700 p-4 space-y-4">
        {transcription.map((turn, index) => (
            <div key={index}>
                <p><strong className="text-gray-400">You:</strong> {turn.user}</p>
                <p><strong className="text-cyan-400">J.A.R.V.I.S.:</strong> {turn.model}</p>
            </div>
        ))}
         {(currentTurn.user || currentTurn.model) && (
            <div>
                <p className="text-gray-500"><strong className="text-gray-400">You:</strong> {currentTurn.user}</p>
                <p className="text-cyan-500"><strong className="text-cyan-400">J.A.R.V.I.S.:</strong> {currentTurn.model}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LiveConvoPanel;
