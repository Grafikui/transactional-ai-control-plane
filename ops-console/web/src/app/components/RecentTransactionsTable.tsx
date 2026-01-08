"use client";
import React from "react";
import { AuditTrail } from "./AuditTrail";


import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  agent: string;
  state: string;
  started: string;
};

export default function RecentTransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load transactions");
        return res.json();
      })
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);

  const filtered = transactions.filter((txn) => {
    const matchesSearch =
      search === "" ||
      txn.id.includes(search) ||
      txn.agent?.toLowerCase().includes(search.toLowerCase());
    const matchesAgent = agentFilter === "" || txn.agent === agentFilter;
    const matchesState = stateFilter === "" || txn.state === stateFilter;
    return matchesSearch && matchesAgent && matchesState;
  });

  const uniqueAgents = Array.from(new Set(transactions.map((t) => t.agent).filter(Boolean)));
  const uniqueStates = Array.from(new Set(transactions.map((t) => t.state).filter(Boolean)));

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
          Error loading transactions: {error}
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by ID or Agent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded w-48"
        />
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Agents</option>
          {uniqueAgents.map((agent) => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All States</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-200 dark:bg-zinc-800">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Agent</th>
              <th className="px-4 py-2 text-left">State</th>
              <th className="px-4 py-2 text-left">Started</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn) => (
              <tr
                key={txn.id}
                className="border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => setSelected(txn)}
              >
                <td className="px-4 py-2 font-mono">{txn.id}</td>
                <td className="px-4 py-2">{txn.agent}</td>
                <td className="px-4 py-2">{txn.state}</td>
                <td className="px-4 py-2">{txn.started}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    {selected && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded shadow-lg p-6 w-full max-w-2xl relative">
          <button
            className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-800"
            onClick={() => setSelected(null)}
          >
            &times;
          </button>
          <h3 className="text-lg font-bold mb-4">Transaction Details</h3>
          <div className="space-y-2 mb-4">
            <div><span className="font-semibold">ID:</span> <span className="font-mono">{selected.id}</span></div>
            <div><span className="font-semibold">Agent:</span> {selected.agent}</div>
            <div><span className="font-semibold">State:</span> {selected.state}</div>
            <div><span className="font-semibold">Started:</span> {selected.started}</div>
            {/* Add more fields/details as needed */}
          </div>
          <AuditTrail transactionId={selected.id} />
        </div>
      </div>
    )}
  </div>
  );
}
