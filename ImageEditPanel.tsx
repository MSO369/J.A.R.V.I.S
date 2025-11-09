
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { PencilSquareIcon, ArrowUpTrayIcon } from '../icons/HeroIcons';
import { fileToBase64 } from '../../utils/helpers';

const ImageEditPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null); // Clear previous edit on new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !originalImageFile) {
      setError("Please upload an image and enter an editing prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Data = await fileToBase64(originalImageFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: originalImageFile.type,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        setEditedImage(imageUrl);
      } else {
        throw new Error("No edited image was returned.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to edit image. The model may not have been able to fulfill the request. Please try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400 mb-6">Image Editing</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* Left Side: Controls & Original Image */}
        <div className="flex flex-col space-y-4">
          <div 
            className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 p-4 cursor-pointer hover:border-cyan-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            {originalImage ? (
              <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-gray-500">
                <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Click to upload an image</p>
                <p className="text-sm">PNG, JPG, WEBP, etc.</p>
              </div>
            )}
          </div>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter, or remove the person in the background"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={!originalImage}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !originalImage || !prompt}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                Editing...
              </>
            ) : (
              <>
                <PencilSquareIcon className="w-5 h-5" />
                Edit Image
              </>
            )}
          </button>
           {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </div>

        {/* Right Side: Edited Image */}
        <div className="flex flex-col items-center justify-center bg-gray-900/50 rounded-lg border border-dashed border-gray-600 p-4">
          {editedImage ? (
            <img src={editedImage} alt="Edited" className="max-h-full max-w-full object-contain rounded-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <PencilSquareIcon className="w-12 h-12 mx-auto mb-2" />
              <p>Your edited image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditPanel;
