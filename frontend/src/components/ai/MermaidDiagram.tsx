import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  definition: string;
}

function getMermaidTheme(isLight: boolean) {
  return {
    startOnLoad: false,
    theme: 'base' as const,
    themeVariables: {
      primaryColor: '#6366f1',
      primaryTextColor: isLight ? '#0f172a' : '#ffffff',
      primaryBorderColor: '#818cf8',
      lineColor: isLight ? '#64748b' : '#475569',
      secondaryColor: isLight ? '#f8fafc' : '#1e293b',
      tertiaryColor: isLight ? '#ffffff' : '#0f172a',
      mainBkg: isLight ? '#ffffff' : '#0f172a',
      nodeBorder: isLight ? '#cbd5e1' : '#334155',
      clusterBkg: isLight ? '#f8fafc' : '#1e293b',
      clusterBorder: isLight ? '#94a3b8' : '#475569',
      defaultLinkColor: isLight ? '#64748b' : '#475569',
      titleColor: isLight ? '#0f172a' : '#e2e8f0',
      edgeLabelBackground: isLight ? '#ffffff' : '#0f172a',
      nodeTextColor: isLight ? '#0f172a' : '#f8fafc',
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis' as const,
    },
    securityLevel: 'loose' as const,
  };
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ definition }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current && definition) {
        try {
          const isLight = document.documentElement.classList.contains('light');
          mermaid.initialize(getMermaidTheme(isLight));
          // Clear previous content
          containerRef.current.innerHTML = '';
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, definition);
          containerRef.current.innerHTML = svg;
          
          // Make it responsive
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
             svgElement.style.width = '100%';
             svgElement.style.height = 'auto';
             svgElement.style.maxWidth = '100%';
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          containerRef.current.innerHTML = `<div class="p-6 text-red-400 bg-red-500/5 border border-red-500/20 rounded-2xl text-xs font-mono">Failed to render diagram. Please try a different visualization style.</div>`;
        }
      }
    };

    renderDiagram();
  }, [definition]);

  return (
    <div
      className="w-full overflow-x-auto py-8 px-4 rounded-[2rem] shadow-inner"
      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}
    >
      <div 
        ref={containerRef} 
        className="mermaid flex justify-center items-center" 
      />
    </div>
  );
};
