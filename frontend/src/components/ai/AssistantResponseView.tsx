import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Send, Sparkles } from 'lucide-react';
import { AiRichText } from './AiRichText';
import { SmartUiRenderer } from './SmartUiRenderer';
import { ProfessionalAreaChart, ProfessionalBarChart } from './ProfessionalCharts';
import { SaaSTable } from '../ui/SaaSTable';

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
    return <SmartUiRenderer response={response.data} variant="aura" />;
  }

  if (response.type === 'chart' && chartData?.points?.length) {
    const xKey = chartData.xKey || 'label';
    const yKey = chartData.yKey || 'value';
    const labels = chartData.points.map((point) => String(point[xKey] ?? '—'));
    const series = chartData.points.map((point) => Number(point[yKey] ?? 0));

    return chartData.points.length > 7
      ? <ProfessionalAreaChart title={plainText || response.meta?.intent || 'Trend'} labels={labels} series={series} />
      : <ProfessionalBarChart title={plainText || response.meta?.intent || 'Chart'} labels={labels} series={series} />;
  }

  if (response.type === 'table' && tableRows.length) {
    return (
      <SaaSTable
        columns={tableColumns.length ? tableColumns : [{ key: 'value', label: 'Value' }]}
        data={tableRows}
        title={response.meta?.intent || 'Results'}
        description={plainText || 'Structured response from the assistant.'}
      />
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
        {plainText ? <AiRichText content={plainText} className="aura-response__content" /> : null}
        {!plainText && hasSnapshotData && response.data ? <KeyValueSnapshot data={response.data} /> : null}
      </div>
    );
  }

  return (
    <div className="aura-response">
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
