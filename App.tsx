import React, { useState } from 'react';
import { Upload, FileCode, Layers, Search, AlertCircle, Loader2, Grid, BookOpen, Activity, LayoutDashboard, Microscope } from 'lucide-react';
import NetworkVisualizer from './components/NetworkVisualizer';
import ModelInfo from './components/ModelInfo';

import DiagnosticLab from './components/DiagnosticLab';
import { analyzeModelFile } from './services/aiService';
import { ModelArchitecture, FileMetadata } from './types';

type Page = 'workspace' | 'library' | 'lab' | 'docs';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('workspace');
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [architecture, setArchitecture] = useState<ModelArchitecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);
    setArchitecture(null);
    setCurrentPage('workspace');

    const metadata: FileMetadata = {
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type,
      lastModified: uploadedFile.lastModified
    };
    setFile(metadata);

    try {
      let snippet = "Binary file content";
      if (uploadedFile.size < 1024 * 50) {
        snippet = await uploadedFile.text();
      } else {
        const buffer = await uploadedFile.slice(0, 1000).arrayBuffer();
        snippet = new TextDecoder().decode(buffer).substring(0, 500);
      }

      const analysis = await analyzeModelFile(metadata, snippet);
      setArchitecture(analysis);
    } catch (err) {
      setError("Failed to analyze model structure. Please ensure the file is a valid model format.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <Dashboard onSelectModel={(mockArch) => { setArchitecture(mockArch); setCurrentPage('workspace'); }} />;
      case 'docs':
        return <Documentation />;
      case 'lab':
        return <DiagnosticLab architecture={architecture} />;
      case 'workspace':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">

            {/* Left Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
              <div className="flex-none bg-white p-5 rounded-2xl border border-gray-300 shadow-md overflow-hidden relative">
                <h2 className="text-sm font-bold text-black mb-1 uppercase tracking-wider">Source Model</h2>
                <p className="text-[11px] text-gray-500 mb-4">Select local model binaries or config files.</p>

                <label className="group relative block">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".h5,.pt,.pth,.onnx,.json,.tflite,.bin"
                  />
                  <div className="w-full py-6 px-4 border-2 border-dashed border-gray-400 group-hover:border-black group-hover:bg-gray-100 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer bg-gray-50">
                    <Upload className="w-5 h-5 text-gray-500 group-hover:text-black mb-2 transition-colors" />
                    <p className="text-[10px] font-bold text-gray-600 group-hover:text-black uppercase tracking-widest">Upload Model File</p>
                  </div>
                </label>

                {file && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-xl border border-gray-300 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileCode className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-black truncate">{file.name}</p>
                        <p className="text-[9px] text-gray-500 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                {architecture ? (
                  <div className="flex flex-col gap-3">
                    {architecture.layers.map((layer, index) => (
                      <div key={index} className="bg-white border border-gray-300 shadow hover:shadow-lg rounded-xl p-3 transition-all flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-bold text-black truncate">{layer.name}</p>
                          <p className="text-[9px] text-gray-500">{layer.type}</p>
                        </div>
                        {layer.description && (
                          <p className="text-[9px] text-gray-600 font-mono">{layer.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !loading && (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl opacity-50 py-12">
                    <Search className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-xs font-bold uppercase tracking-tighter text-gray-500">Awaiting analysis...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-100 border border-red-300 p-4 rounded-xl flex items-start gap-3 text-red-600 text-[11px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Right Content - Full Height Visualization */}
            <div className="lg:col-span-9 flex flex-col h-full">
              <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-300 shadow-md overflow-hidden relative">
                
                {/* Viz Header */}
                <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Neural Connection Map</h2>
                  </div>
                  {architecture && (
                    <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-600">
                      <span className="text-black">{architecture.layers.length} Layers</span>
                      <div className="h-3 w-px bg-gray-300"></div>
                      <span>{architecture.type}</span>
                    </div>
                  )}
                </div>

                {/* Viz Body */}
                <div className="flex-1 relative bg-gray-50">
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-40">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                      <p className="text-base font-bold text-black uppercase tracking-widest">Synthesizing Layers</p>
                      <p className="text-[11px] text-gray-500 mt-2 font-mono">Mapping weights, bias, and propagation flow...</p>
                    </div>
                  ) : architecture ? (
                    <NetworkVisualizer architecture={architecture} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                       <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-300 shadow-md">
                        <Layers className="w-8 h-8 text-gray-500" />
                       </div>
                       <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Import a model to initialize visualization</p>
                    </div>
                  )}
                </div>

                {/* Viz Footer */}
                <div className="px-4 py-2 border-t border-gray-300 bg-gray-50 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider">
                      <span className="w-2 h-0.5 bg-blue-500 rounded-sm"></span> Propagation Pathways
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 border border-gray-300 rounded-full"></span> Neural Unit
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 font-medium">Vector Engine Ready • 60FPS Render</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 text-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-gray-300 bg-white z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div onClick={() => setCurrentPage('workspace')} className="cursor-pointer">
              <h1 className="text-lg font-bold text-black leading-none">Neural <span className="text-blue-600">AI</span></h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Model Deconstruction v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-600">
              <button onClick={() => setCurrentPage('workspace')} className={`flex items-center gap-2 transition-colors ${currentPage === 'workspace' ? 'text-blue-600' : 'hover:text-black'}`}>
                <Activity className="w-3.5 h-3.5" /> Workspace
              </button>
              
              <button onClick={() => setCurrentPage('lab')} className={`flex items-center gap-2 transition-colors ${currentPage === 'lab' ? 'text-blue-600' : 'hover:text-black'}`}>
                <Microscope className="w-3.5 h-3.5" /> Diagnostic Lab
              </button>
              
            </nav>
            <div className="h-6 w-px bg-gray-300"></div>
            <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg text-xs transition-all border border-gray-300 font-medium">
              Enterprise
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 overflow-hidden">
        {renderPage()}
      </main>

      <footer className="flex-none border-t border-gray-300 bg-white px-6 py-2 text-center text-gray-500 text-[9px] font-bold uppercase tracking-[0.3em]">
        NeuralInsight Advanced Diagnostics Platform
      </footer>
    </div>
  );
};

export default App;
