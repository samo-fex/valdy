
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, DollarSign, Target, BarChart3, Users, Clock, Zap, Trophy, Rocket } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChartData {
  market_breakdown: Array<{ name: string; value: number; color: string }>;
  revenue_projections: Array<{ year: string; revenue: number; costs: number }>;
  financial_table: Array<{ metric: string; value: string }>;
  key_metrics?: Array<{ label: string; value: string; icon?: string }>;
  competitive_landscape?: Array<{ name: string; [key: string]: any }>;
  channels?: Array<{ name: string; percentage: number }>;
  milestones?: Array<{ quarter: string; milestone: string; status?: string }>;
  team_composition?: Array<{ role: string; count: number; color?: string }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMERALD_COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
const CHANNEL_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const ICON_MAP: Record<string, React.ElementType> = {
  target: Target,
  dollar: DollarSign,
  clock: Clock,
  trending: TrendingUp,
  users: Users,
  zap: Zap,
  trophy: Trophy,
  rocket: Rocket,
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-emerald-500/30 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-emerald-400 font-semibold text-xs mb-1">{label || payload[0]?.name}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white/90 text-xs">
          <span style={{ color: entry.color || entry.fill }}>●</span>{' '}
          {entry.name}: <span className="font-bold">{entry.value}{typeof entry.value === 'number' && entry.value < 100 ? '%' : ''}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-emerald-500/30 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-white/90 text-xs">
        <span style={{ color: payload[0]?.payload?.color || payload[0]?.fill }}>●</span>{' '}
        {payload[0]?.name}: <span className="font-bold text-emerald-400">${payload[0]?.value}B</span>
      </p>
    </div>
  );
}

// ─── Section: Executive Summary ──────────────────────────────────────────────

/**
 * Renders key metric cards for the Executive Summary section.
 * Displays 2-4 metric cards with icons, values, and labels in a responsive grid.
 */
export function ExecutiveSummaryCharts({ chartData }: { chartData: ChartData }) {
  const metrics = chartData.key_metrics;
  if (!metrics || metrics.length === 0) return null;

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric, i) => {
          const IconComp = ICON_MAP[metric.icon || 'zap'] || Zap;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-4 text-center backdrop-blur-sm hover:border-emerald-400/40 transition-all hover:scale-[1.02]"
            >
              <div className="flex justify-center mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <IconComp className="text-emerald-400" size={18} />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{metric.value}</p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wide">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Section: Market & Sales ─────────────────────────────────────────────────

/**
 * Renders market analysis visualizations including market breakdown pie chart,
 * go-to-market channel bars, and competitive positioning radar chart.
 */
export function MarketSalesCharts({ chartData }: { chartData: ChartData }) {
  return (
    <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mt-4 space-y-5">
      {/* Row 1: Pie Chart + Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Market Breakdown Pie */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-emerald-400" size={18} />
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Market Breakdown</h4>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(chartData.market_breakdown || [])}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {(chartData.market_breakdown || []).map((entry, index) => (
                    <Cell key={index} fill={entry.color || EMERALD_COLORS[index % EMERALD_COLORS.length]} stroke="rgba(255,255,255,0.08)" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => <span className="text-white/70 text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Go-to-Market Channels */}
        {(chartData.channels || []) && (chartData.channels || []).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="text-emerald-400" size={18} />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Go-to-Market Channels</h4>
            </div>
            <div className="space-y-3 mt-4">
              {(chartData.channels || []).map((ch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/80 font-medium">{ch.name}</span>
                    <span className="text-xs font-bold text-emerald-400">{ch.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${ch.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Competitive Landscape Radar */}
      {(chartData.competitive_landscape || []) && (chartData.competitive_landscape || []).length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="text-emerald-400" size={18} />
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Competitive Positioning</h4>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={(chartData.competitive_landscape || [])}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 9 }} domain={[0, 100]} />
                {Object.keys((chartData.competitive_landscape || [])[0] || {}).filter(k => k !== 'name').map((key, i) => (
                  <Radar key={key} name={key.replace(/_/g, ' ')} dataKey={key} stroke={EMERALD_COLORS[i % EMERALD_COLORS.length]} fill={EMERALD_COLORS[i % EMERALD_COLORS.length]} fillOpacity={0.15} animationDuration={1200} />
                ))}
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => <span className="text-white/70 text-xs capitalize">{value}</span>} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Section: Team & Operations ──────────────────────────────────────────────

/**
 * Renders team and operations visualizations including 12-month milestone timeline
 * and team composition donut chart with role breakdown.
 */
export function TeamOperationsCharts({ chartData }: { chartData: ChartData }) {
  const hasMilestones = (chartData.milestones || []) && (chartData.milestones || []).length > 0;
  const hasTeam = (chartData.team_composition || []) && (chartData.team_composition || []).length > 0;
  if (!hasMilestones && !hasTeam) return null;

  const totalTeam = (chartData.team_composition || []).reduce((sum, t) => sum + t.count, 0);

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mt-4 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Milestone Timeline */}
        {hasMilestones && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-emerald-400" size={18} />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">12-Month Roadmap</h4>
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-800/30" />
              <div className="space-y-4">
                {(chartData.milestones || []).map((ms, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                    className="flex items-start gap-4 pl-1"
                  >
                    <div className="relative z-10 w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-emerald-400">{ms.quarter}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex-1 hover:bg-white/10 transition-colors">
                      <p className="text-sm text-white/90 font-medium">{ms.milestone}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team Composition */}
        {hasTeam && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-emerald-400" size={18} />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Team Composition</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(chartData.team_composition || [])}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="count"
                      animationBegin={300}
                      animationDuration={1000}
                    >
                      {(chartData.team_composition || []).map((entry, index) => (
                        <Cell key={index} fill={entry.color || EMERALD_COLORS[index % EMERALD_COLORS.length]} stroke="rgba(255,255,255,0.08)" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {(chartData.team_composition || []).map((team, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: team.color || EMERALD_COLORS[i % EMERALD_COLORS.length] }} />
                      <span className="text-xs text-white/80">{team.role}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{team.count}</span>
                  </motion.div>
                ))}
                <div className="pt-2 mt-2 border-t border-white/10 flex justify-between">
                  <span className="text-xs text-white/50">Total</span>
                  <span className="text-xs font-bold text-emerald-400">{totalTeam}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section: Financial Plan ─────────────────────────────────────────────────

/**
 * Renders financial visualizations including revenue/costs/profit bar chart,
 * key financial metrics table, and detailed revenue breakdown table.
 */
export function FinancialPlanCharts({ chartData }: { chartData: ChartData }) {
  const revenueWithProfit = (chartData.revenue_projections || []).map(r => ({
    ...r,
    profit: r.revenue - r.costs,
  }));

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mt-4 space-y-5">
      {/* Bar Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="text-emerald-400" size={18} />
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Revenue Projections</h4>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueWithProfit} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} label={{ value: '$ Millions', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 10 } }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => <span className="text-white/70 text-xs">{value}</span>} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={400} />
              <Bar dataKey="costs" fill="#f59e0b" name="Costs" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={600} />
              <Bar dataKey="profit" fill="#06b6d4" name="Profit" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Financial Metrics Table */}
        {(chartData.financial_table || []) && (chartData.financial_table || []).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="text-emerald-400" size={18} />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Key Financial Metrics</h4>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-700/40">
                    <th className="text-left text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Metric</th>
                    <th className="text-right text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(chartData.financial_table || []).map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className={`${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'} border-b border-white/5 hover:bg-white/10 transition-colors`}
                    >
                      <td className="px-4 py-2.5 text-sm text-white/80">{row.metric}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-bold text-emerald-400">{row.value}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Breakdown Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-emerald-400" size={18} />
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Revenue Breakdown</h4>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-700/40">
                  <th className="text-left text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Period</th>
                  <th className="text-right text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Revenue</th>
                  <th className="text-right text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Costs</th>
                  <th className="text-right text-xs font-bold text-emerald-300 uppercase tracking-wider px-4 py-2.5">Profit</th>
                </tr>
              </thead>
              <tbody>
                {(chartData.revenue_projections || []).map((row, i) => {
                  const profit = row.revenue - row.costs;
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className={`${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'} border-b border-white/5 hover:bg-white/10 transition-colors`}
                    >
                      <td className="px-4 py-2.5 text-sm text-white/80 font-medium">{row.year}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-bold text-emerald-400">${row.revenue}M</td>
                      <td className="px-4 py-2.5 text-sm text-right font-bold text-amber-400">${row.costs}M</td>
                      <td className={`px-4 py-2.5 text-sm text-right font-bold ${profit > 0 ? 'text-cyan-400' : 'text-red-400'}`}>${profit}M</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
