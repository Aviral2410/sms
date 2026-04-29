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
  const rows = Object.entries(data)
    .filter(([key]) => !['chart', 'raw', 'result'].includes(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—'),
    }));

  if (!rows.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/35">{row.key}</div>
          <div className="mt-2 text-sm leading-6 text-white/80">{row.value}</div>
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
    <div className="space-y-4 rounded-[1.4rem] border border-amber-400/20 bg-amber-500/[0.08] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/15 p-2 text-amber-200">
          <AlertTriangle size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-amber-200/80">Confirmation needed</div>
          <div className="mt-2 text-sm leading-7 text-white/85">{text || 'This action needs your confirmation before it can run.'}</div>
        </div>
      </div>

      {confirmationToken && onConfirmAction ? (
        <button
          type="button"
          onClick={() => onConfirmAction(confirmationToken)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
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

  if (!response) {
    return null;
  }

  if (response.type === 'smart_ui') {
    return <SmartUiRenderer response={response.data} />;
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
      <div className="space-y-4 rounded-[1.4rem] border border-emerald-400/20 bg-emerald-500/[0.08] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-200">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-200/80">Action complete</div>
            <div className="mt-2 text-sm leading-7 text-white/85">{plainText || 'The assistant completed your request successfully.'}</div>
          </div>
        </div>
        {response.data ? <KeyValueSnapshot data={response.data} /> : null}
      </div>
    );
  }

  if (response.type === 'status' || response.type === 'error' || response.type === 'text') {
    return (
      <div className={`space-y-4 rounded-[1.4rem] border p-4 ${
        response.type === 'error'
          ? 'border-rose-400/20 bg-rose-500/[0.08]'
          : 'border-white/10 bg-white/[0.03]'
      }`}>
        {plainText ? <AiRichText content={plainText} className="text-sm leading-7 text-white/85" /> : null}
        {response.data ? <KeyValueSnapshot data={response.data} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200/70">
        <Clock3 size={14} />
        Assistant response
      </div>
      {plainText ? <AiRichText content={plainText} className="text-sm leading-7 text-white/85" /> : null}
      {response.data ? <KeyValueSnapshot data={response.data} /> : null}
      {!plainText && !response.data ? (
        <div className="flex items-center gap-2 text-sm text-white/55">
          <Sparkles size={14} className="text-emerald-300" />
          No additional content was returned for this response.
        </div>
      ) : null}
    </div>
  );
}

export default AssistantResponseView;
