import React, { useState, useEffect, useCallback } from 'react';
import { Server, ConnectionStatus } from './types';
import { SERVERS, RECOMMENDED_SERVER } from './constants';
import ServerList from './components/ServerList';
import PowerIcon from './components/icons/PowerIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import XCircleIcon from './components/icons/XCircleIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import GlobeAltIcon from './components/icons/GlobeAltIcon';
import { getOptimalServerSuggestion } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [selectedServer, setSelectedServer] = useState<Server>(RECOMMENDED_SERVER);
  const [showServerList, setShowServerList] = useState<boolean>(false);
  const [suggestionQuery, setSuggestionQuery] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [time, setTime] = useState<string>('00:00:00');
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [speedInterval, setSpeedInterval] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0.00 Mbps');
  const [uploadSpeed, setUploadSpeed] = useState<string>('0.00 Mbps');
  const [newIp, setNewIp] = useState<string>('');
  const [browserUrl, setBrowserUrl] = useState<string>('');
  const [isBrowsing, setIsBrowsing] = useState<boolean>(false);
  const [browseMessage, setBrowseMessage] = useState<string>('');


  const startSpeedSimulator = useCallback(() => {
    const interval = setInterval(() => {
      const down = (Math.random() * (95 - 20) + 20).toFixed(2);
      const up = (Math.random() * (25 - 5) + 5).toFixed(2);
      setDownloadSpeed(`${down} Mbps`);
      setUploadSpeed(`${up} Mbps`);
    }, 1200);
    setSpeedInterval(interval);
  }, []);

  const stopSpeedSimulator = useCallback(() => {
    if (speedInterval) {
      clearInterval(speedInterval);
      setSpeedInterval(null);
    }
    setDownloadSpeed('0.00 Mbps');
    setUploadSpeed('0.00 Mbps');
  }, [speedInterval]);


  const startTimer = useCallback(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(Math.floor(seconds % 60)).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    }, 1000);
    setTimerInterval(interval);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTime('00:00:00');
  }, [timerInterval]);

  const handleConnect = () => {
    if (status === ConnectionStatus.DISCONNECTED) {
      setStatus(ConnectionStatus.CONNECTING);
      setTimeout(() => {
        setStatus(ConnectionStatus.AUTHENTICATING);
        setTimeout(() => {
          setStatus(ConnectionStatus.SECURING);
          setTimeout(() => {
            setStatus(ConnectionStatus.CONNECTED);
            startTimer();
            startSpeedSimulator();
            setNewIp(`${selectedServer.ipPrefix}.${Math.floor(Math.random() * 253) + 1}`);
          }, 1000);
        }, 1000);
      }, 1000);
    } else if (status === ConnectionStatus.CONNECTED) {
      setStatus(ConnectionStatus.DISCONNECTING);
      setTimeout(() => {
        setStatus(ConnectionStatus.DISCONNECTED);
        stopTimer();
        stopSpeedSimulator();
        setNewIp('');
        setBrowserUrl('');
        setBrowseMessage('');
      }, 1000);
    }
  };

  const handleServerSelect = (server: Server) => {
    if (status === ConnectionStatus.DISCONNECTED) {
      setSelectedServer(server);
    }
    setShowServerList(false);
  };

  const handleGetSuggestion = async () => {
    if (!suggestionQuery.trim() || isSuggesting) return;
    setIsSuggesting(true);
    try {
        const countryList = SERVERS.map(s => s.country);
        const suggestedCountry = await getOptimalServerSuggestion(suggestionQuery, countryList);
        const foundServer = SERVERS.find(s => s.country.toLowerCase() === suggestedCountry.toLowerCase());
        if (foundServer) {
          if (status === ConnectionStatus.DISCONNECTED) {
            setSelectedServer(foundServer);
          }
        } else {
            console.warn(`Suggested country "${suggestedCountry}" not found in server list.`);
        }
    } catch (error) {
        console.error("Failed to get suggestion:", error);
    } finally {
        setIsSuggesting(false);
        setSuggestionQuery('');
    }
  };

  const handleBrowse = () => {
    if (!browserUrl.trim() || isBrowsing) return;
    setIsBrowsing(true);
    setBrowseMessage('');
    setTimeout(() => {
      setIsBrowsing(false);
      const url = browserUrl.startsWith('http') ? browserUrl : `https://${browserUrl}`;
      setBrowseMessage(`✅ Successfully accessed ${url} via ${selectedServer.country}.`);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (speedInterval) clearInterval(speedInterval);
    };
  }, [timerInterval, speedInterval]);
  

  const getStatusInfo = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return { text: 'Connected', color: 'text-green-400', icon: <CheckCircleIcon /> };
      case ConnectionStatus.CONNECTING:
        return { text: 'Connecting...', color: 'text-yellow-400', icon: null };
      case ConnectionStatus.AUTHENTICATING:
        return { text: 'Authenticating...', color: 'text-yellow-400', icon: null };
      case ConnectionStatus.SECURING:
        return { text: 'Securing Connection...', color: 'text-yellow-400', icon: null };
      case ConnectionStatus.DISCONNECTING:
        return { text: 'Disconnecting...', color: 'text-orange-400', icon: null };
      case ConnectionStatus.DISCONNECTED:
      default:
        return { text: 'Disconnected', color: 'text-gray-400', icon: <XCircleIcon /> };
    }
  };

  const { text: statusText, color: statusColor, icon: statusIcon } = getStatusInfo();

  const isTransitioning = status === ConnectionStatus.CONNECTING || 
                          status === ConnectionStatus.DISCONNECTING ||
                          status === ConnectionStatus.AUTHENTICATING ||
                          status === ConnectionStatus.SECURING;

  const buttonClass =
    status === ConnectionStatus.CONNECTED
      ? 'bg-green-500 hover:bg-green-600'
      : isTransitioning
      ? 'bg-yellow-500 cursor-not-allowed'
      : 'bg-gray-700 hover:bg-gray-600';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_50%)]"></div>
      
      <div className="w-full max-w-sm mx-auto z-10">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Gemini VPN</h1>
          <p className="text-slate-400">Your secure connection to the world.</p>
        </header>

        <main className="flex flex-col items-center gap-6">
          <button
            onClick={handleConnect}
            disabled={isTransitioning}
            className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-slate-950/50 ${buttonClass}`}
          >
            {isTransitioning && status !== ConnectionStatus.DISCONNECTING && (
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin"></div>
            )}
            <PowerIcon className="w-20 h-20 text-white" />
          </button>

          <div className="text-center">
            <div className={`flex items-center justify-center gap-2 text-xl font-medium ${statusColor}`}>
              {statusIcon}
              <span>{statusText}</span>
            </div>
            {status === ConnectionStatus.CONNECTED && (
              <p className="text-2xl font-mono mt-2 text-cyan-300">{time}</p>
            )}
          </div>
          
          <div className={`w-full transition-all duration-500 ${status === ConnectionStatus.CONNECTED ? 'opacity-100' : 'opacity-0'}`}>
            {status === ConnectionStatus.CONNECTED && (
              <div className="space-y-4">
                <div className="w-full bg-slate-800/50 rounded-lg p-4 flex justify-around text-center">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Download</p>
                        <p className="font-semibold text-cyan-300 flex items-center justify-center gap-1 mt-1">
                            <i className="fas fa-arrow-down text-xs"></i>
                            <span>{downloadSpeed}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Upload</p>
                        <p className="font-semibold text-cyan-300 flex items-center justify-center gap-1 mt-1">
                            <i className="fas fa-arrow-up text-xs"></i>
                            <span>{uploadSpeed}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">New IP</p>
                        <p className="font-mono font-semibold text-cyan-300 mt-1">{newIp}</p>
                    </div>
                </div>

                <div className="w-full bg-slate-800/50 rounded-lg p-4 text-center">
                    <h3 className="text-slate-300 text-sm uppercase tracking-wider mb-3">Secure Browser Simulation</h3>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={browserUrl}
                            onChange={(e) => setBrowserUrl(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleBrowse()}
                            placeholder="Enter a website to visit..."
                            className="w-full bg-slate-700 text-gray-200 placeholder-gray-400 rounded-md py-2 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                            disabled={isBrowsing}
                        />
                        <button
                            onClick={handleBrowse}
                            disabled={isBrowsing || !browserUrl.trim()}
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold p-2 rounded-md flex items-center justify-center transition"
                            aria-label="Browse"
                        >
                            {isBrowsing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <GlobeAltIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {browseMessage && (
                        <p className="mt-3 text-sm text-green-400 animate-fade-in-fast">{browseMessage}</p>
                    )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 p-6 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                    type="text"
                    value={suggestionQuery}
                    onChange={(e) => setSuggestionQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGetSuggestion()}
                    placeholder="e.g., 'fastest server for gaming in EU'"
                    className="w-full bg-slate-700 text-gray-200 placeholder-gray-400 rounded-md py-3 pl-4 pr-28 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    disabled={isSuggesting || status !== ConnectionStatus.DISCONNECTED}
                />
                <button
                    onClick={handleGetSuggestion}
                    disabled={isSuggesting || !suggestionQuery.trim() || status !== ConnectionStatus.DISCONNECTED}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-md flex items-center gap-2 transition"
                >
                    {isSuggesting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        <span>AI</span>
                      </>
                    )}
                </button>
              </div>

            <button
              onClick={() => setShowServerList(true)}
              disabled={status !== ConnectionStatus.DISCONNECTED}
              className="w-full bg-slate-700/80 hover:bg-slate-700 text-gray-200 rounded-md p-3 flex justify-between items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedServer.flag}</span>
                <div>
                  <p className="font-semibold text-left">{selectedServer.country}</p>
                  <p className="text-xs text-slate-400 text-left">{selectedServer.city}</p>
                </div>
              </div>
              <ChevronDownIcon className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          
        </div>
      </footer>

      {showServerList && (
        <ServerList
          servers={SERVERS}
          selectedServer={selectedServer}
          onSelect={handleServerSelect}
          onClose={() => setShowServerList(false)}
        />
      )}
      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;