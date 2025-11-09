
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PhotoIcon } from '../icons/HeroIcons';

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

const ImageGenPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        setGeneratedImage(imageUrl);
      } else {
        throw new Error("No image was generated.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-6">Image Generation</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">Prompt</label>
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic cityscape at dusk, neon lights reflecting on wet streets"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="1:1">Square (1:1)</option>
            <option value="16:9">Landscape (16:9)</option>
            <option value="9:16">Portrait (9:16)</option>
            <option value="4:3">Standard (4:3)</option>
            <option value="3:4">Tall (3:4)</option>
          </select>
        </div>
        <button
          onClick={handleGenerate}
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
              <PhotoIcon className="w-5 h-5" />
              Generate Image
            </>
          )}
        </button>
        {error && <p className="text-red-400 text-center">{error}</p>}
      </div>

      <div className="flex-1 mt-6 flex items-center justify-center bg-gray-900/50 rounded-lg border border-dashed border-gray-600">
        {generatedImage ? (
          <img src={generatedImage} alt="Generated" className="max-h-full max-w-full object-contain rounded-lg" />
        ) : (
          <div className="text-center text-gray-500">
            <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
            <p>Your generated image will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenPanel;
