
import React, { useState, useMemo } from 'react';
import { Server } from '../types';

interface ServerListProps {
  servers: Server[];
  selectedServer: Server;
  onSelect: (server: Server) => void;
  onClose: () => void;
}

const ServerList: React.FC<ServerListProps> = ({ servers, selectedServer, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServers = useMemo(() => {
    return servers.filter(server =>
      server.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [servers, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 animate-fade-in">
      <div 
        className="w-full max-w-lg h-[80vh] bg-slate-800 rounded-t-2xl flex flex-col shadow-lg animate-slide-up"
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-bold">Select a Server</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sticky top-[73px] bg-slate-800 z-10">
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 text-gray-200 placeholder-gray-400 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex-grow overflow-y-auto">
          {filteredServers.length > 0 ? (
            <ul>
              {filteredServers.map(server => (
                <li key={server.id}>
                  <button
                    onClick={() => onSelect(server)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{server.flag}</span>
                      <div>
                        <p className="font-semibold text-left">{server.country}</p>
                        <p className="text-sm text-slate-400 text-left">{server.city}</p>
                      </div>
                    </div>
                    {selectedServer.id === server.id && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 text-slate-400">
                <p>No servers found.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ServerList;
