import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { SpeakerWaveIcon, ArrowDownTrayIcon } from '../icons/HeroIcons';
import { decode, decodeAudioData, createWavBlob } from '../../utils/helpers';

const TtsPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) {
      setError("Please enter some text to speak.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedAudio(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setGeneratedAudio(base64Audio);
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      } else {
        throw new Error("No audio data received from API.");
      }

    } catch (e) {
      console.error(e);
      setError("Failed to generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;

    try {
      const pcmData = decode(generatedAudio);
      // The TTS model provides 24kHz, 1-channel, 16-bit PCM audio.
      const wavBlob = createWavBlob(pcmData, 24000, 1, 16);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'jarvis-speech.wav';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("Failed to create download link:", e);
      setError("Could not prepare the audio file for download.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-6">Text-to-Speech</h2>
      <div className="flex-1 flex flex-col space-y-4">
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here and I will speak it for you..."
          className="w-full flex-1 bg-gray-700/50 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSpeak}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="w-5 h-5" />
                Speak
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!generatedAudio || isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download
          </button>
        </div>
        {error && <p className="text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default TtsPanel;