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
};

type Props = {
  response?: RenderedResponse | null;
  onConfirmAction?: (confirmationToken: string) => void | Promise<void>;
  actionPending?: boolean;
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
  const columnKeys = new Set<string>();
  rows.forEach((row) => {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((key) => columnKeys.add(key));
    }
  });
  return [...columnKeys].slice(0, 12).map((key) => ({ key, label: key.replace(/([A-Z])/g, ' $1').trim() || key }));
}

function ResponseToolbar({ response }: { response: RenderedResponse }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="aura-response__toolbar">
      <button
        type="button"
        className="aura-response__toolbar-btn"
        onClick={async () => {
          await copyArtifactSummary(response);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        <Copy size={14} />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button type="button" className="aura-response__toolbar-btn" onClick={() => printArtifact(response)}>
        <FileText size={14} />
        Print / PDF
      </button>
      <button type="button" className="aura-response__toolbar-btn" onClick={() => downloadArtifactMarkdown(response)}>
        <Download size={14} />
        Markdown
      </button>
      <button type="button" className="aura-response__toolbar-btn" onClick={() => downloadArtifactDoc(response)}>
        <FileText size={14} />
        Doc
      </button>
    </div>
  );
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

function ComposedResponseView({ response }: { response: RenderedResponse }) {
  const sections = Array.isArray(response.data?.sections) ? response.data.sections : [];

  return (
    <div className="aura-composed-response">
      {typeof response.data?.summary === 'string' && response.data.summary.trim() ? (
        <div className="aura-response">
          <AiRichText content={response.data.summary} className="aura-response__content" />
        </div>
      ) : null}

      {sections.map((section: any, index: number) => {
        if (section?.kind === 'markdown' && typeof section.content === 'string') {
          return (
            <div key={`section-${index}`} className="aura-response">
              {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
              <AiRichText content={section.content} className="aura-response__content" />
            </div>
          );
        }

        if (section?.kind === 'table' && Array.isArray(section.rows)) {
          const columns = extractColumns(section.rows);
          return (
            <div key={`section-${index}`} className="aura-composed-response__artifact">
              <SaaSTable
                columns={columns.length ? columns : [{ key: 'value', label: 'Value' }]}
                data={section.rows}
                title={section?.title || 'Structured table'}
                description={section?.description || 'Assistant-generated table'}
              />
            </div>
          );
        }

        if (section?.kind === 'chart' && section?.chart?.points?.length) {
          const chart = section.chart;
          const labels = chart.points.map((point: any) => String(point[chart.xKey || 'label'] ?? '—'));
          const series = chart.points.map((point: any) => Number(point[chart.yKey || 'value'] ?? 0));
          return chart.points.length > 7 ? (
            <div key={`section-${index}`} className="aura-composed-response__artifact">
              <ProfessionalAreaChart title={section?.title || 'Trend'} labels={labels} series={series} />
            </div>
          ) : (
            <div key={`section-${index}`} className="aura-composed-response__artifact">
              <ProfessionalBarChart title={section?.title || 'Chart'} labels={labels} series={series} />
            </div>
          );
        }

        if (section?.kind === 'checklist') {
          return <ChecklistSection key={`section-${index}`} section={section} />;
        }

        if (section?.kind === 'snapshot' && section?.data && typeof section.data === 'object') {
          return (
            <div key={`section-${index}`} className="aura-response">
              {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
              <KeyValueSnapshot data={section.data} />
            </div>
          );
        }

        if (section?.kind === 'smart_ui' && section?.response && typeof section.response === 'object') {
          return (
            <div key={`section-${index}`} className="aura-composed-response__artifact">
              {section?.title ? <div className="aura-response__eyebrow aura-response__eyebrow--spaced">{section.title}</div> : null}
              <SmartUiRenderer response={section.response} variant="aura" embedded />
            </div>
          );
        }

        if (section?.kind === 'suggestions' && Array.isArray(section.items)) {
          return (
            <div key={`section-${index}`} className="aura-response">
              {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
              <div className="aura-composed-suggestions">
                {section.items.map((item: any, itemIndex: number) => (
                  <div key={`${index}-suggestion-${itemIndex}`} className="aura-composed-suggestions__item">
                    {typeof item === 'string' ? item : item?.label || 'Next step'}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={`section-${index}`} className="aura-response">
            {section?.title ? <div className="aura-response__eyebrow">{section.title}</div> : null}
            <pre className="aura-composed-response__fallback">{JSON.stringify(section, null, 2)}</pre>
          </div>
        );
      })}
    </div>
  );
}

function KeyValueSnapshot({ data }: { data: Record<string, any> }) {
  const rows = extractSnapshotEntries(data);

  if (!rows.length) return null;

  return (
    <div className="aura-response__snapshot">
      {rows.map((row) => (
        <div key={row.key} className="aura-response__snapshot-item">
          <div className="aura-response__snapshot-key">{row.key}</div>
          <div className="aura-response__snapshot-value">{row.value}</div>
        </div>
      ))}
    </div>
  );
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

export function AssistantResponseView({ response, onConfirmAction, actionPending }: Props) {
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

  if (response.type === 'composed') {
    return (
      <>
        <ResponseToolbar response={response} />
        <ComposedResponseView response={response} />
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
