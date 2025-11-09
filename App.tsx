
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/panels/ChatPanel';
import ImageGenPanel from './components/panels/ImageGenPanel';
import GroundingPanel from './components/panels/GroundingPanel';
import LiveConvoPanel from './components/panels/LiveConvoPanel';
import AnalysisPanel from './components/panels/AnalysisPanel';
import TtsPanel from './components/panels/TtsPanel';
import ImageEditPanel from './components/panels/ImageEditPanel';

type View = 'chat' | 'image-gen' | 'image-edit' | 'grounding' | 'live-convo' | 'analysis' | 'tts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatPanel />;
      case 'image-gen':
        return <ImageGenPanel />;
      case 'image-edit':
        return <ImageEditPanel />;
      case 'grounding':
        return <GroundingPanel />;
      case 'live-convo':
        return <LiveConvoPanel />;
      case 'analysis':
        return <AnalysisPanel />;
      case 'tts':
        return <TtsPanel />;
      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full h-full bg-gray-800/30 rounded-lg border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
