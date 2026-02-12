
import React from 'react';
import { ModelArchitecture } from '../types';
import { Brain, Cpu, Activity, Layout, ShieldCheck } from 'lucide-react';

interface Props {
  architecture: ModelArchitecture;
}

const ModelInfo: React.FC<Props> = ({ architecture }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{architecture.name}</h2>
            <p className="text-blue-400 text-sm font-medium">{architecture.type}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {architecture.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Parameters</span>
            </div>
            <p className="text-sm font-mono text-white">{architecture.totalParameters}</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Layers</span>
            </div>
            <p className="text-sm font-mono text-white">{architecture.layers.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Layout className="w-4 h-4" /> Recommended Use Case
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
          {architecture.useCase}
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-6 rounded-2xl border border-indigo-500/20">
        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Structural Integrity
        </h3>
        <ul className="space-y-3">
          {architecture.layers.slice(0, 3).map((layer, idx) => (
            <li key={idx} className="flex items-center gap-3 text-xs text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Layer <span className="text-slate-200 font-mono">{layer.name}</span> verified as <span className="text-indigo-300">{layer.type}</span></span>
            </li>
          ))}
          <li className="text-[10px] text-slate-500 mt-4 italic">
            * Visualization shows logical connection map based on architectural signatures.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ModelInfo;
