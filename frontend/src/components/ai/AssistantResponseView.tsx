import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Copy, Download, FileText, Send, Sparkles } from 'lucide-react';
import { AiRichText } from './AiRichText';
import { SmartUiRenderer } from './SmartUiRenderer';
import { ProfessionalAreaChart, ProfessionalBarChart } from './ProfessionalCharts';
import { SaaSTable } from '../ui/SaaSTable';
import { copyArtifactSummary, downloadArtifactDoc, downloadArtifactMarkdown, printArtifact } from './assistantArtifactExport';

type RenderedResponse = {
  type: string;
  data: Record<string, any> | null;
  meta?: Record<string, any> | null;
  thought?: string | null;
  blocks?: Array<{
    type: string;
    content?: string;
    data?: any;
    meta?: any;
  }>;
};

type Props = {
  response?: RenderedResponse | null;
  onConfirmAction?: (confirmationToken: string) => void | Promise<void>;
  actionPending?: boolean;
  isStreaming?: boolean;
};

function toText(data: Record<string, any> | null | undefined) {
  if (!data) return '';
  if (typeof data.text === 'string' && data.text.trim()) return data.text;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data.summary === 'string' && data.summary.trim()) return data.summary;
  return '';
}

function extractSnapshotEntries(data: Record<string, any> | null | undefined) {
  if (!data) return [];

  return Object.entries(data)
    .filter(([key, value]) => {
      if ([
        'chart',
        'raw',
        'result',
        'text',
        'message',
        'summary',
        'title',
        'description',
        'thought',
        'markdown',
        'html',
      ].includes(key)) {
        return false;
      }

      if (value == null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—'),
    }));
}

function extractTableRows(data: Record<string, any> | null | undefined) {
  if (!data) return [];
  if (Array.isArray(data.rows)) return data.rows;
  const arrayValue = Object.values(data).find((value) => Array.isArray(value));
  return Array.isArray(arrayValue) ? arrayValue : [];
}

function extractColumns(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  const columnKeys = new Set<string>();
  rows.forEach((row) => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((key) => columnKeys.add(key));
    }
  });
  return [...columnKeys].slice(0, 12).map((key) => ({ key, label: key.replace(/([A-Z])/g, ' $1').trim() || key }));
}

function ResponseToolbar({ response }: { response: RenderedResponse }) {
  return null;
}

function ChecklistSection({ section }: { section: any }) {
  const items = Array.isArray(section?.items) ? section.items : [];
  if (!items.length) return null;

  return (
    <div className="aura-response">
      {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
      <div className="aura-composed-checklist">
        {items.map((item: any, index: number) => (
          <div key={`${section?.title || 'check'}-${index}`} className="aura-composed-checklist__item">
            <div className="aura-composed-checklist__dot" />
            <div>{typeof item === 'string' ? item : item?.label || 'Untitled checklist item'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComposedResponseView({ response, isStreaming }: { response: RenderedResponse; isStreaming?: boolean }) {
  const sections = useMemo(() => {
    if (response.type === 'composed' && Array.isArray(response.data?.sections)) {
      return response.data.sections;
    }
    if (response.type === 'mixed' && Array.isArray(response.blocks)) {
      return response.blocks.map(b => ({
        kind: b.type === 'text' ? 'markdown' : b.type,
        content: b.content,
        ...b
      }));
    }
    return [];
  }, [response]);

  return (
    <div className="aura-composed-response space-y-6">
      {typeof response.data?.summary === 'string' && response.data.summary.trim() ? (
        <div className="aura-response">
          <AiRichText content={response.data.summary} className="aura-response__content" isStreaming={isStreaming} />
        </div>
      ) : null}

      {sections.map((section: any, index: number) => {
        const isLastSection = index === sections.length - 1;
        if ((section?.kind === 'markdown' || section?.kind === 'text') && typeof (section.content || section.text) === 'string') {
          return (
            <div key={`section-${index}`} className="aura-response animate-in fade-in slide-in-from-bottom-2 duration-500">
              {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
              <AiRichText content={section.content || section.text} className="aura-response__content" isStreaming={isStreaming && isLastSection} />
            </div>
          );
        }

        if (section?.kind === 'table' && (Array.isArray(section.rows) || Array.isArray(section.data?.rows))) {
          const rows = section.rows || section.data?.rows;
          const columns = extractColumns(rows);
          return (
            <div key={`section-${index}`} className="aura-composed-response__artifact glass-card p-0 overflow-hidden">
              <SaaSTable
                columns={columns.length ? columns : [{ key: 'value', label: 'Value' }]}
                data={rows}
                title={section?.title || 'Structured table'}
                description={section?.description || 'Assistant-generated table'}
              />
            </div>
          );
        }

        if (section?.kind === 'chart' && (section?.chart?.points?.length || section?.data?.points?.length)) {
          const chart = section.chart || section.data;
          const labels = chart.points.map((point: any) => String(point[chart.xKey || 'label'] ?? '—'));
          const series = chart.points.map((point: any) => Number(point[chart.yKey || 'value'] ?? 0));
          return chart.points.length > 7 ? (
            <div key={`section-${index}`} className="aura-composed-response__artifact glass-card p-6">
              <ProfessionalAreaChart title={section?.title || 'Trend'} labels={labels} series={series} />
            </div>
          ) : (
            <div key={`section-${index}`} className="aura-composed-response__artifact glass-card p-6">
              <ProfessionalBarChart title={section?.title || 'Chart'} labels={labels} series={series} />
            </div>
          );
        }

        if (section?.kind === 'checklist') {
          return <ChecklistSection key={`section-${index}`} section={section} />;
        }

        if (section?.kind === 'snapshot' && (section?.data || section?.content) && typeof (section.data || section.content) === 'object') {
          return (
            <div key={`section-${index}`} className="aura-response glass-card p-6">
              {section?.title ? <div className="aura-response__eyebrow mb-4">{section.title}</div> : null}
              <KeyValueSnapshot data={section.data || section.content} />
            </div>
          );
        }

        if (section?.kind === 'smart_ui' && (section?.response || section?.data) && typeof (section.response || section.data) === 'object') {
          return (
            <div key={`section-${index}`} className="aura-composed-response__artifact">
              {section?.title ? <div className="aura-response__eyebrow aura-response__eyebrow--spaced">{section.title}</div> : null}
              <SmartUiRenderer response={section.response || section.data} variant="aura" embedded />
            </div>
          );
        }

        if (section?.kind === 'suggestions' && Array.isArray(section.items)) {
          return (
            <div key={`section-${index}`} className="aura-response mt-4">
              {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
              <div className="aura-composed-suggestions flex flex-wrap gap-2">
                {section.items.map((item: any, itemIndex: number) => (
                  <button 
                    key={`${index}-suggestion-${itemIndex}`} 
                    className="aura-composed-suggestions__item px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/80"
                  >
                    {typeof item === 'string' ? item : item?.label || 'Next step'}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={`section-${index}`} className="aura-response bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-500">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-white/30">Unsupported content</div>
              <div className="text-sm text-white/50">{section?.title || 'This block contains a format not yet supported by the viewer.'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeyValueSnapshot({ data }: { data: Record<string, any> }) {
  return null;
}

function ConfirmationCard({
  text,
  confirmationToken,
  onConfirmAction,
  pending,
}: {
  text: string;
  confirmationToken?: string;
  onConfirmAction?: (confirmationToken: string) => void | Promise<void>;
  pending?: boolean;
}) {
  return (
    <div className="aura-response aura-response--warning">
      <div className="aura-response__header">
        <div className="aura-response__icon">
          <AlertTriangle size={16} />
        </div>
        <div className="min-w-0">
          <div className="aura-response__eyebrow">Confirmation needed</div>
          <div className="aura-response__content">{text || 'This action needs your confirmation before it can run.'}</div>
        </div>
      </div>

      {confirmationToken && onConfirmAction ? (
        <button
          type="button"
          onClick={() => onConfirmAction(confirmationToken)}
          disabled={pending}
          className="aura-response__confirm"
        >
          <Send size={15} />
          {pending ? 'Confirming...' : 'Confirm action'}
        </button>
      ) : null}
    </div>
  );
}

export function AssistantResponseView({ response, onConfirmAction, actionPending, isStreaming }: Props) {
  const chartData = response?.data?.chart as { points?: Array<Record<string, any>>; xKey?: string; yKey?: string } | undefined;
  const tableRows = useMemo(() => extractTableRows(response?.data), [response?.data]);
  const tableColumns = useMemo(() => extractColumns(tableRows), [tableRows]);
  const plainText = toText(response?.data);
  const hasSnapshotData = Boolean(extractSnapshotEntries(response?.data).length);

  if (!response) {
    return null;
  }

  if (response.type === 'smart_ui') {
    return (
      <>
        <ResponseToolbar response={response} />
        <SmartUiRenderer response={response.data} variant="aura" />
      </>
    );
  }

  if (response.type === 'composed' || response.type === 'mixed') {
    return (
      <>
        <ResponseToolbar response={response} />
        <ComposedResponseView response={response} isStreaming={isStreaming} />
      </>
    );
  }

  if (response.type === 'chart' && chartData?.points?.length) {
    const xKey = chartData.xKey || 'label';
    const yKey = chartData.yKey || 'value';
    const labels = chartData.points.map((point) => String(point[xKey] ?? '—'));
    const series = chartData.points.map((point) => Number(point[yKey] ?? 0));

    return (
      <>
        <ResponseToolbar response={response} />
        {chartData.points.length > 7
          ? <ProfessionalAreaChart title={plainText || response.meta?.intent || 'Trend'} labels={labels} series={series} />
          : <ProfessionalBarChart title={plainText || response.meta?.intent || 'Chart'} labels={labels} series={series} />}
      </>
    );
  }

  if (response.type === 'table' && tableRows.length) {
    return (
      <>
        <ResponseToolbar response={response} />
        <SaaSTable
          columns={tableColumns.length ? tableColumns : [{ key: 'value', label: 'Value' }]}
          data={tableRows}
          title={response.meta?.intent || 'Results'}
          description={plainText || 'Structured response from the assistant.'}
        />
      </>
    );
  }

  if (response.type === 'action') {
    const confirmationToken = typeof response.meta?.confirmationToken === 'string' ? response.meta.confirmationToken : undefined;
    if (confirmationToken) {
      return (
        <ConfirmationCard
          text={plainText}
          confirmationToken={confirmationToken}
          onConfirmAction={onConfirmAction}
          pending={actionPending}
        />
      );
    }

    return (
      <div className="aura-response aura-response--success">
        <ResponseToolbar response={response} />
        <div className="aura-response__header">
          <div className="aura-response__icon">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <div className="aura-response__eyebrow">Action complete</div>
            <div className="aura-response__content">{plainText || 'The assistant completed your request successfully.'}</div>
          </div>
        </div>
        {response.data ? <KeyValueSnapshot data={response.data} /> : null}
      </div>
    );
  }

  if (response.type === 'status' || response.type === 'error' || response.type === 'text') {
    return (
      <div className={`aura-response ${response.type === 'error' ? 'aura-response--warning' : ''}`}>
        <ResponseToolbar response={response} />
        {plainText ? <AiRichText content={plainText} className="aura-response__content" /> : null}
        {!plainText && hasSnapshotData && response.data ? <KeyValueSnapshot data={response.data} /> : null}
      </div>
    );
  }

  return (
    <div className="aura-response">
      <ResponseToolbar response={response} />
      <div className="aura-response__eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Clock3 size={14} />
        Assistant response
      </div>
      {plainText ? <AiRichText content={plainText} className="aura-response__content" /> : null}
      {!plainText && hasSnapshotData && response.data ? <KeyValueSnapshot data={response.data} /> : null}
      {!plainText && !response.data ? (
        <div className="aura-response__content" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} />
          No additional content was returned for this response.
        </div>
      ) : null}
    </div>
  );
}

export default AssistantResponseView;
