'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { useState } from 'react';
import { ConsumerFlowLogProps } from './types';

export function ConsumerFlowLog({ flowLog }: ConsumerFlowLogProps) {
  const [filterReason, setFilterReason] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'destination'>('timestamp');

  const reasons = ['all', ...Array.from(new Set(flowLog.map(entry => {
    if (entry.reason.includes('Exact match')) return 'exact-match';
    if (entry.reason.includes('Brand score')) return 'brand-score';
    if (entry.reason.includes('only option')) return 'only-option';
    return 'other';
  })))];

  const filteredLog = flowLog.filter(entry => {
    if (filterReason === 'all') return true;
    if (filterReason === 'exact-match') return entry.reason.includes('Exact match');
    if (filterReason === 'brand-score') return entry.reason.includes('Brand score');
    if (filterReason === 'only-option') return entry.reason.includes('only option');
    return true;
  });

  const sortedLog = [...filteredLog].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else {
      return a.destination.localeCompare(b.destination);
    }
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes('Exact match')) return 'text-green-400';
    if (reason.includes('Brand score')) return 'text-blue-400';
    if (reason.includes('only option')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('Exact match')) return '🎯';
    if (reason.includes('Brand score')) return '⭐';
    if (reason.includes('only option')) return '📌';
    return 'ℹ️';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Consumer Flow Log</CardTitle>
          <p className="text-gray-400 text-sm">
            Detailed tracking of consumer distribution based on factory schematics and brand scores
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Filter by reason:</label>
              <select 
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
              >
                {reasons.map(reason => (
                  <option key={reason} value={reason}>
                    {reason === 'all' ? 'All Reasons' : 
                     reason === 'exact-match' ? 'Exact Match' :
                     reason === 'brand-score' ? 'Brand Score' :
                     reason === 'only-option' ? 'Only Option' : reason}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'destination')}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="timestamp">Timestamp</option>
                <option value="destination">Destination</option>
              </select>
            </div>
          </div>

          {/* Flow Log */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedLog.map((entry, index) => (
              <div 
                key={entry.id} 
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-650 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getReasonIcon(entry.reason)}</span>
                    <span className="text-sm font-medium text-gray-300">
                      Consumer #{index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-400">Profile: </span>
                    <span className="text-sm text-white font-mono">
                      {entry.consumerProfile}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-400">Destination: </span>
                    <span className="text-sm text-blue-400 font-semibold">
                      {entry.destination}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-400">Reason: </span>
                    <span className={`text-sm ${getReasonColor(entry.reason)}`}>
                      {entry.reason}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{sortedLog.length}</div>
                <div className="text-xs text-gray-400">Total Consumers</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {sortedLog.filter(entry => entry.reason.includes('Exact match')).length}
                </div>
                <div className="text-xs text-gray-400">Exact Matches</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {sortedLog.filter(entry => entry.reason.includes('Brand score')).length}
                </div>
                <div className="text-xs text-gray-400">Brand Score Wins</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {Array.from(new Set(sortedLog.map(entry => entry.destination.split(' ')[0]))).length}
                </div>
                <div className="text-xs text-gray-400">Companies Served</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 