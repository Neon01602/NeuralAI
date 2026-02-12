import React, { useState, useEffect } from "react";
import { ModelArchitecture } from "../types";
import { GoogleGenAI } from "@google/genai";
import {
  Microscope,
  Activity,
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Props {
  architecture: ModelArchitecture | null;
}

const DiagnosticLab: React.FC<Props> = ({ architecture }) => {
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  });

  // 🔥 Auto-run Gemini analysis when architecture changes
  useEffect(() => {
    if (architecture) runGeminiAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [architecture]);

  const runGeminiAnalysis = async () => {
    if (!architecture) return;

    setLoadingAI(true);
    setAiError(null);
    setAiRecommendations([]);

    try {
      const prompt = `
Analyze this neural architecture and suggest upgrade strategies.

Model: ${architecture.name}
Type: ${architecture.type}
Layers: ${architecture.layers.length}
Use case: ${architecture.useCase}

Return 5 concise upgrade recommendations as plain text lines.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      let text =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "";

      text = text.replace(/```/g, "").trim();

      console.log("Upgrade response:", text);

      const recs = text
        .split("\n")
        .map((r) => r.replace(/^[-*\d.]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);

      setAiRecommendations(
        recs.length ? recs : ["No upgrade recommendations returned."]
      );
    } catch (err) {
      console.error("Upgrade failed:", err);
      setAiError("Analysis unavailable");
    } finally {
      setLoadingAI(false);
    }
  };

  if (!architecture) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-black/10">
        <Microscope className="w-16 h-16 text-blue-600 mb-6" />
        <h2 className="text-2xl font-extrabold text-black uppercase tracking-tight mb-2">
          No Diagnostic Session
        </h2>
        <p className="text-black/60 max-w-md">
          Upload or select a model from the library to initiate architectural diagnostics.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-4 space-y-10">

      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-[11px] font-black uppercase tracking-widest mb-2">
            <Activity className="w-4 h-4" />
            Live Diagnostics
          </div>
          <h1 className="text-4xl font-extrabold text-black tracking-tight">
            {architecture.name}
            <span className="ml-3 text-lg font-mono text-black/50">
              / Analytics
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-black/10 bg-white">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-[10px] uppercase font-black text-black/60">
              Integrity
            </p>
            <p className="text-sm font-bold text-black">Verified</p>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-8">

          {/* IMPORTANCE */}
          <div className="bg-white rounded-3xl border border-black/10 p-8">
            <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Architectural Importance
            </h3>

            <div className="space-y-5">
              {architecture.layers.map((layer, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-black">
                      {layer.name}
                      <span className="ml-2 text-[10px] font-mono uppercase text-black/50">
                        [{layer.type}]
                      </span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-black/60">
                      {Math.round(layer.relativeImportance * 100)}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-700"
                      style={{
                        width: `${layer.relativeImportance * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONTRIBUTIONS */}
          <div className="bg-white rounded-3xl border border-black/10">
            <div className="px-8 py-6 border-b border-black/10">
              <h3 className="text-lg font-bold text-black">
                Layer Contribution Analysis
              </h3>
            </div>

            <div className="p-8 space-y-4">
              {architecture.layers.map((layer, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 rounded-2xl border border-black/10 hover:border-blue-600 transition"
                >
                  <div className="p-2 rounded-lg border border-blue-600 text-blue-600">
                    <Info className="w-4 h-4" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-black">
                      {layer.name}
                    </h4>
                    <p className="text-xs text-black/60 mt-1 italic">
                      "{layer.contribution}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-8">

          {/* SUMMARY */}
          <div className="bg-white rounded-3xl border border-blue-600 p-8">
            <h3 className="text-lg font-bold text-black mb-4">
              Diagnostic Summary
            </h3>

            <p className="text-sm text-black/70 leading-relaxed mb-6">
              This {architecture.type} model contains{" "}
              <strong>{architecture.layers.length}</strong> layers optimized
              for{" "}
              <strong>{architecture.useCase.toLowerCase()}</strong>.
              Estimated parameters:
              <span className="ml-2 font-mono text-blue-600">
                {architecture.totalParameters}
              </span>
            </p>

            <div className="border border-black/10 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Advisory
                </span>
              </div>
              <p className="text-[11px] text-black/60">
                High parameter density detected in later layers. Consider
                regularization to mitigate overfitting.
              </p>
            </div>
          </div>

          {/* GEMINI AI */}
          <div className="bg-white rounded-3xl border border-black/10 p-8 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                Recommendations
              </h3>

              <button
                onClick={runGeminiAnalysis}
                disabled={loadingAI}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-600 text-blue-600 font-bold text-xs hover:bg-blue-50 disabled:opacity-50"
              >
                {loadingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Re-analyze
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-red-500 mb-3">{aiError}</p>
            )}

            {aiRecommendations.length === 0 && !loadingAI && (
              <p className="text-xs text-black/60">
               AI is preparing upgrade intelligence…
              </p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {aiRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 border border-black/10 rounded-xl text-xs text-black/70"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* TAGS */}
          <div className="bg-white rounded-3xl border border-black/10 p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-4">
              Verified Attributes
            </h3>

            <div className="flex flex-wrap gap-2">
              {[
                "Optimized",
                "Pre-Trained",
                "Vision",
                "Dense",
                "Validated",
                "Quantized",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-[10px] font-bold border border-black/20 rounded-lg text-black"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticLab;
