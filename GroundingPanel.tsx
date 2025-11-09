
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GlobeAltIcon, MapPinIcon, LinkIcon } from '../icons/HeroIcons';
import { marked } from 'marked';

type SearchMode = 'web' | 'maps';
type GroundingChunk = { web?: { uri: string; title: string }; maps?: { uri: string; title: string } };

const GroundingPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<SearchMode>('web');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);

  const handleSearch = async () => {
    if (!prompt.trim()) {
      setError("Please enter a query.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let toolConfig: any = {};
      let tools: any[] = [];

      if (mode === 'web') {
        tools.push({ googleSearch: {} });
      } else { // maps
        tools.push({ googleMaps: {} });
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          toolConfig.retrievalConfig = {
            latLng: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          };
        } catch (geoError) {
          setError("Could not get location. Please enable location services. Proceeding without location.");
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools, toolConfig },
      });
      
      setResult(response.text);
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        setSources(groundingChunks);
      }

    } catch (e) {
      console.error(e);
      setError("Failed to perform search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-4">Grounded Search</h2>
      <div className="flex items-center bg-gray-700/50 rounded-lg p-1 mb-4">
        <button 
          onClick={() => setMode('web')} 
          className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold flex items-center justify-center gap-2 ${mode === 'web' ? 'bg-cyan-600 text-white' : 'text-gray-300'}`}
        >
          <GlobeAltIcon className="w-5 h-5"/> Web Search
        </button>
        <button 
          onClick={() => setMode('maps')} 
          className={`w-1/2 py-2 rounded-md transition-colors text-sm font-bold flex items-center justify-center gap-2 ${mode === 'maps' ? 'bg-cyan-600 text-white' : 'text-gray-300'}`}
        >
          <MapPinIcon className="w-5 h-5"/> Maps Search
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={mode === 'web' ? "e.g., Who won the most medals in the Paris 2024 Olympics?" : "e.g., Good Italian restaurants nearby"}
          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 pr-28 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          disabled={isLoading}
        />
        <button 
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute inset-y-0 right-2 my-2 px-4 py-1.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : 'Search'}
        </button>
      </div>
       {error && <p className="text-red-400 text-center mt-2">{error}</p>}
      
      <div className="flex-1 mt-4 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700 p-4">
        {result ? (
          <div>
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: marked(result) }}
            />
            {sources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold font-orbitron text-cyan-400 flex items-center gap-2"><LinkIcon className="w-5 h-5"/> Sources</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {sources.map((source, index) => {
                    const item = source.web || source.maps;
                    if (!item) return null;
                    return (
                       <li key={index} className="flex items-start gap-2">
                         <span className="text-cyan-400 pt-1">&#9679;</span>
                         <a href={item.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline hover:text-cyan-200 transition-colors">
                           {item.title}
                         </a>
                       </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Search results will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroundingPanel;
