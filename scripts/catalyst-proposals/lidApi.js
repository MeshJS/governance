// lidApi.js
import fetch from 'node-fetch';

const API_BASE = 'https://www.lidonation.com/api/catalyst-explorer';
/**
 * Fetches voting metrics for a single proposal by title & fund number.
 *
 * @param {Object} params
 * @param {number|string} params.fundNumber  — e.g. 10 for “Fund 10”
 * @param {string} params.title             — exact proposal title
 * @param {string} params.csrfToken         — your X‑CSRF‑TOKEN header value
 * @returns {Promise<{ proposalId: number, yes_votes_count: number, no_votes_count: number, abstain_votes_count: number|null, unique_wallets: number }>}
 */
export async function getProposalMetrics({ fundNumber, title, csrfToken }) {
  const headers = {
    'Accept': 'application/json',
    'X-CSRF-TOKEN': csrfToken,
  };

  // 1) Get all funds, find the one matching “Fund ${fundNumber}”
  const fundsRes = await fetch(`${API_BASE}/funds`, { headers });
  if (!fundsRes.ok) throw new Error(`Failed to fetch funds: ${fundsRes.status}`);
  const { data: funds } = await fundsRes.json();
  const fund = funds.find(f => f.title === `Fund ${fundNumber}`);
  if (!fund) throw new Error(`Fund ${fundNumber} not found`);
  const fundId = fund.id;

  // 2) Search proposals in that fund for the exact title
  const searchTerm = encodeURIComponent(title);
  const propsRes = await fetch(
    `${API_BASE}/proposals?fund_id=${fundId}&search=${searchTerm}&per_page=5&page=1`,
    { headers }
  );
  if (!propsRes.ok) throw new Error(`Failed to search proposals: ${propsRes.status}`);
  const propsJson = await propsRes.json();
  const match = propsJson.data.find(p => p.title === title);
  if (!match) throw new Error(`Proposal titled "${title}" not found in Fund ${fundNumber}`);
  const proposalId = match.id;

  // 3) Fetch full proposal details by ID
  const detailRes = await fetch(`${API_BASE}/proposals/${proposalId}`, { headers });
  if (!detailRes.ok) throw new Error(`Failed to fetch proposal ${proposalId}: ${detailRes.status}`);
  const { data: detail } = await detailRes.json();

  const {
    yes_votes_count,
    no_votes_count,
    abstain_votes_count,
    unique_wallets
  } = detail;

  return { proposalId, yes_votes_count, no_votes_count, abstain_votes_count, unique_wallets };
}
