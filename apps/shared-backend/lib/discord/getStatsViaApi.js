// getStatsViaApi.js - Refactored for Netlify background function usage

// ——— Configurable API fetcher ———

/**
 * Fetches and processes Discord engagement stats from the API.
 * @param {Object} params
 * @param {string} params.guildId - Discord guild/server ID
 * @param {string} params.token - Discord analytics token
 * @param {boolean} [params.backfill] - Whether to backfill data
 * @param {number} [params.backfillYear] - Year to backfill from
 * @param {string} [params.apiBaseUrl] - API base URL (optional)
 * @returns {Promise<Object>} Processed stats object keyed by YYYY-MM
 */
export async function fetchDiscordStatsViaApi({ guildId, token, backfill = false, backfillYear = new Date().getFullYear(), apiBaseUrl = '' }) {

  // Build query parameters for engagement API
  const params = new URLSearchParams({
    guild_id: guildId
  });

  // Add date parameters for backfill if needed
  if (backfill) {
    const startDate = new Date(backfillYear, 0, 1).toISOString(); // Start of year
    const endDate = new Date(backfillYear, 11, 31, 23, 59, 59, 999).toISOString(); // End of year
    params.append('start', startDate);
    params.append('end', endDate);
    params.append('interval', '3'); // 3-day intervals (monthly data)
  }

  const relativeUrl = `/api/discord/engagement?${params.toString()}`;
  const url = apiBaseUrl ? `${apiBaseUrl}${relativeUrl}` : relativeUrl;
  console.log(`🌐 Calling engagement API: ${url}`);

  // Use global fetch (Node 18+ or Netlify env)
  const response = await fetch(url, {
    headers: {
      'Authorization': token,
      'Accept': '*/*'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const rawData = await response.json();
  if (rawData.error) {
    throw new Error(`API returned error: ${rawData.error}`);
  }

  // Transform the API response to match the expected format
  // API returns array of daily data, we need to aggregate by month
  const monthlyData = {};
  for (const dayData of rawData) {
    const date = new Date(dayData.day_pt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        totalMessages: 0,
        uniquePosters: 0, // communicators
        memberCounts: [], // collect all approximate_member_count values
        totalVisitors: 0,
        totalCommunicators: 0,
        daysCounted: 0
      };
    }
    monthlyData[monthKey].totalMessages += dayData.messages || 0;
    monthlyData[monthKey].totalVisitors += dayData.visitors || 0;
    monthlyData[monthKey].totalCommunicators += dayData.communicators || 0;
    if (typeof dayData.approximate_member_count === 'number') {
      monthlyData[monthKey].memberCounts.push(dayData.approximate_member_count);
    }
    monthlyData[monthKey].daysCounted += 1;
  }

  // Calculate averages and finalize the data
  const processedData = {};
  for (const [monthKey, data] of Object.entries(monthlyData)) {
    // Use the maximum approximate_member_count for the month, or fallback to average visitors if not available
    let memberCount = 0;
    if (data.memberCounts.length > 0) {
      memberCount = Math.max(...data.memberCounts);
    } else {
      memberCount = Math.round(data.totalVisitors / data.daysCounted);
    }
    processedData[monthKey] = {
      memberCount,
      totalMessages: data.totalMessages,
      uniquePosters: Math.round(data.totalCommunicators / data.daysCounted) // Average daily communicators
    };
  }

  return processedData;
}
