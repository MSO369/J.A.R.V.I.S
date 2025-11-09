
import React from 'react';
import { ChatBubbleLeftRightIcon, PhotoIcon, GlobeAltIcon, MicrophoneIcon, DocumentMagnifyingGlassIcon, SpeakerWaveIcon, PencilSquareIcon } from './icons/HeroIcons';

type View = 'chat' | 'image-gen' | 'image-edit' | 'grounding' | 'live-convo' | 'analysis' | 'tts';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out group ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-400'
        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
    }`}
  >
    <span className={`mr-4 ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'}`}>{icon}</span>
    <span className="truncate">{label}</span>
    <div className={`absolute left-0 w-1 h-full bg-cyan-400 transition-transform duration-300 ease-in-out ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></div>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat Assistant', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
    { id: 'image-gen', label: 'Image Generation', icon: <PhotoIcon className="w-6 h-6" /> },
    { id: 'image-edit', label: 'Image Editing', icon: <PencilSquareIcon className="w-6 h-6" /> },
    { id: 'grounding', label: 'Grounded Search', icon: <GlobeAltIcon className="w-6 h-6" /> },
    { id: 'live-convo', label: 'Live Conversation', icon: <MicrophoneIcon className="w-6 h-6" /> },
    { id: 'analysis', label: 'Content Analysis', icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" /> },
    { id: 'tts', label: 'Text-to-Speech', icon: <SpeakerWaveIcon className="w-6 h-6" /> },
  ];

  return (
    <aside className="w-64 bg-gray-900/70 backdrop-blur-lg border-r border-cyan-500/20 flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-cyan-500/20">
        <h1 className="text-2xl font-bold text-cyan-400 font-orbitron">J.A.R.V.I.S.</h1>
      </div>
      <nav className="flex-1 py-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.id} className="relative">
            <NavItem
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          </div>
        ))}
      </nav>
       <div className="p-4 border-t border-cyan-500/20 text-xs text-center text-gray-500">
        <p>&copy; 2024. Powered by Gemini.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
