
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PhotoIcon, MusicalNoteIcon, ArrowUpTrayIcon } from '../icons/HeroIcons';
import { fileToBase64 } from '../../utils/helpers';
import { marked } from 'marked';

type AnalysisMode = 'image' | 'audio';

const AnalysisPanel: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>('image');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      if (mode === 'image' && selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else if (mode === 'audio' && selectedFile.type.startsWith('audio/')) {
        setFilePreview(selectedFile.name);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    setFile(null);
    setFilePreview(null);
    setPrompt('');
    setResult(null);
    setError(null);
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a file to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Data = await fileToBase64(file);
      const filePart = { inlineData: { data: base64Data, mimeType: file.type } };

      const model = mode === 'image' ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
      const defaultPrompt = mode === 'image' ? "Describe this image in detail." : "Transcribe this audio.";
      
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [filePart, { text: prompt || defaultPrompt }] }
      });

      setResult(response.text);

    } catch (e) {
      console.error(e);
      setError(`Failed to analyze ${mode}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getAcceptType = () => mode === 'image' ? 'image/*' : 'audio/*';

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-4">Content Analysis</h2>
      <div className="flex items-center bg-gray-700/50 rounded-lg p-1 mb-4">
        <button onClick={() => handleModeChange('image')} className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold flex items-center justify-center gap-2 ${mode === 'image' ? 'bg-cyan-600 text-white' : 'text-gray-300'}`}>
          <PhotoIcon className="w-5 h-5"/> Image Analysis
        </button>
        <button onClick={() => handleModeChange('audio')} className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold flex items-center justify-center gap-2 ${mode === 'audio' ? 'bg-cyan-600 text-white' : 'text-gray-300'}`}>
          <MusicalNoteIcon className="w-5 h-5"/> Audio Transcription
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="space-y-4 flex flex-col">
          <div 
            className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 p-4 cursor-pointer hover:border-cyan-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} accept={getAcceptType()} onChange={handleFileChange} className="hidden" />
            {!filePreview ? (
              <div className="text-center text-gray-500">
                <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Click to upload {mode}</p>
              </div>
            ) : mode === 'image' ? (
              <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-gray-400">
                <MusicalNoteIcon className="w-12 h-12 mx-auto mb-2" />
                <p>{filePreview}</p>
              </div>
            )}
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'image' ? "Optional: Ask something specific about the image" : "Optional: Provide context for transcription"}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={!file}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !file}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : `Analyze ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          </button>
          {error && <p className="text-red-400 text-center">{error}</p>}
        </div>
        
        <div className="overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700 p-4">
          {result ? (
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: marked(result) }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Analysis results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
