import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ProfessionalBarChart: React.FC<{ title: string; labels: string[]; series: number[] }> = ({ title, labels, series }) => {
  const data = labels.map((label, i) => ({ name: label, value: series[i] }));

  return (
    <div className="bg-[#0a1829] border border-white/10 rounded-2xl p-5 my-4 h-[350px]">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-6">{title}</h4>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020c1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: '#10b981', fontWeight: 800, fontSize: '12px' }}
          />
          <Bar 
            dataKey="value" 
            fill="#10b981" 
            radius={[6, 6, 0, 0]} 
            fillOpacity={0.8}
            activeBar={{ fillOpacity: 1, stroke: '#10b981', strokeWidth: 2 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ProfessionalAreaChart: React.FC<{ title: string; labels: string[]; series: number[] }> = ({ title, labels, series }) => {
  const data = labels.map((label, i) => ({ name: label, value: series[i] }));

  return (
    <div className="bg-[#0a1829] border border-white/10 rounded-2xl p-5 my-4 h-[350px]">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-6">{title}</h4>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020c1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: '#10b981', fontWeight: 800, fontSize: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorVal)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ProfessionalPieChart: React.FC<{ title: string; labels: string[]; series: number[] }> = ({ title, labels, series }) => {
  const data = labels.map((label, i) => ({ name: label, value: series[i] }));

  return (
    <div className="bg-[#0a1829] border border-white/10 rounded-2xl p-5 my-4 h-[350px]">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-6">{title}</h4>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ backgroundColor: '#020c1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-[10px] font-bold text-white/40 uppercase">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
