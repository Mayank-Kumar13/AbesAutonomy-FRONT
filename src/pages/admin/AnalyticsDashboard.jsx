import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../../services/api';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';
import './AnalyticsDashboard.css';

const formatDuration = (ms) => {
  if (ms == null) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const MetricCard = ({ title, data, format = 'number' }) => {
  if (!data) return (
    <div className="analytics-card">
      <div className="analytics-card-title">{title}</div>
      <div className="analytics-card-value">--</div>
    </div>
  );

  const { value, prev } = data;
  let formattedValue = value;
  let formattedPrev = prev;
  
  if (format === 'time') {
    formattedValue = formatDuration(value);
    formattedPrev = formatDuration(prev);
  } else if (format === 'number') {
    formattedValue = value.toLocaleString();
    formattedPrev = prev.toLocaleString();
  }

  let percentChange = 0;
  if (prev > 0) {
    percentChange = ((value - prev) / prev) * 100;
  } else if (value > 0) {
    percentChange = 100;
  }

  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  return (
    <div className="analytics-card">
      <div className="analytics-card-title">{title}</div>
      <div className="analytics-card-value">{formattedValue}</div>
      <div className={`analytics-card-trend ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
        {isPositive ? '↑' : isNegative ? '↓' : '—'} 
        {Math.abs(percentChange).toFixed(1)}% vs prev period
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="custom-tooltip-item" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span>
              {entry.name.includes('Time') || entry.name.includes('Engagement') 
                ? formatDuration(entry.value) 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard() {
  const [range, setRange] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [interval, setIntervalOption] = useState('Daily');

  const [overview, setOverview] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { range };
      if (range === 'custom') {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const [overviewRes, graphRes, contentRes] = await Promise.all([
        analyticsApi.getOverview(params),
        analyticsApi.getActivityGraph({ ...params, interval }),
        analyticsApi.getContentEngagement(params)
      ]);

      setOverview(overviewRes.data);
      setGraphData(graphRes.data);
      setContentData(contentRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd, interval]);

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
        <div className="analytics-controls">
          {range === 'custom' && (
            <>
              <input type="date" className="analytics-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span style={{ color: '#9ca3af' }}>to</span>
              <input type="date" className="analytics-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </>
          )}
          <select className="analytics-select" value={range} onChange={e => setRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {loading && !overview ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading analytics...</div>
      ) : (
        <>
          <div className="analytics-cards">
            <div className="analytics-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderColor: '#312e81' }}>
              <div className="analytics-card-title">Total Platform Users</div>
              <div className="analytics-card-value">{overview?.totalUsers?.toLocaleString() || 0}</div>
              <div className="analytics-card-trend neutral">Lifetime</div>
            </div>
            <MetricCard title="Active Users" data={overview?.activeUsers} />
            <MetricCard title="New Users" data={overview?.newUsers} />
            <MetricCard title="Returning Users" data={overview?.returningUsers} />
            <MetricCard title="Total Engagement Time" data={overview?.totalEngagementTime} format="time" />
            <MetricCard title="Avg Session Duration" data={overview?.averageSessionDuration} format="time" />
          </div>

          <div className="analytics-section">
            <div className="analytics-section-header">
              <h3 className="analytics-section-title">User Activity & Engagement</h3>
              <select className="analytics-select" value={interval} onChange={e => setIntervalOption(e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            
            <div className="analytics-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fill: '#8b5cf6' }} 
                    tickFormatter={(val) => Math.floor(val/60000) + 'm'} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="activeUsers" name="Active Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                  <Area yAxisId="left" type="monotone" dataKey="newUsers" name="New Users" stroke="#10b981" fillOpacity={1} fill="url(#colorNew)" />
                  <Line yAxisId="right" type="monotone" dataKey="engagementMs" name="Engagement Time" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="analytics-card" style={{ background: '#0f172a' }}>
              <div className="analytics-card-title">Daily Active Users (DAU)</div>
              <div className="analytics-card-value">{overview?.dau?.toLocaleString() || 0}</div>
              <div className="analytics-card-trend neutral">Today</div>
            </div>
            <div className="analytics-card" style={{ background: '#0f172a' }}>
              <div className="analytics-card-title">Weekly Active Users (WAU)</div>
              <div className="analytics-card-value">{overview?.wau?.toLocaleString() || 0}</div>
              <div className="analytics-card-trend neutral">Last 7 days</div>
            </div>
            <div className="analytics-card" style={{ background: '#0f172a' }}>
              <div className="analytics-card-title">Monthly Active Users (MAU)</div>
              <div className="analytics-card-value">{overview?.mau?.toLocaleString() || 0}</div>
              <div className="analytics-card-trend neutral">Last 30 days</div>
            </div>
          </div>

          <div className="analytics-section">
            <h3 className="analytics-section-title" style={{ marginBottom: '1.5rem' }}>Top Content Engagement</h3>
            {contentData.length > 0 ? (
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Content (PDF Title)</th>
                      <th style={{ textAlign: 'right' }}>Views</th>
                      <th style={{ textAlign: 'right' }}>Unique Users</th>
                      <th style={{ textAlign: 'right' }}>Total Time</th>
                      <th style={{ textAlign: 'right' }}>Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentData.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{item.content}</td>
                        <td style={{ textAlign: 'right', color: '#9ca3af' }}>{item.views.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#9ca3af' }}>{item.uniqueUsers.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatDuration(item.totalTimeMs)}</td>
                        <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatDuration(item.avgTimeMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#9ca3af' }}>No content engagement recorded for this period.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
