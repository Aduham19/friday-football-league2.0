import { formatPlayerName } from '../constants';
import { LeagueData, Match, Player, PlayerMatchRecord } from '../types';
import { calculatePlayerStats, computeStandings } from './stats';

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const LOGO_HEADER_HTML = `
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px; border-bottom: 2px solid #d97706; padding: 8px 14px; background: #0f172a; border-radius: 8px; color: white;">
    <div style="width: 40px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <defs>
          <linearGradient id="expGoldBorderGrad" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="25%" stop-color="#EAB308" />
            <stop offset="50%" stop-color="#CA8A04" />
            <stop offset="75%" stop-color="#FACC15" />
            <stop offset="100%" stop-color="#A16207" />
          </linearGradient>
          <linearGradient id="expGoldInnerGrad" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="50%" stop-color="#EAB308" />
            <stop offset="100%" stop-color="#854D0E" />
          </linearGradient>
          <radialGradient id="expShieldDarkGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="60%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#020617" />
          </radialGradient>
          <linearGradient id="expBootWhiteGrad" x1="40" y1="90" x2="150" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#E2E8F0" />
            <stop offset="100%" stop-color="#94A3B8" />
          </linearGradient>
          <radialGradient id="expBallShine" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="60%" stop-color="#E2E8F0" />
            <stop offset="100%" stop-color="#64748B" />
          </radialGradient>
        </defs>
        <path d="M100 232 C65 210 20 180 20 100 V30 C20 26 40 20 100 12 C160 20 180 26 180 30 V100 C180 180 135 210 100 232 Z" fill="url(#expGoldBorderGrad)" stroke="#78350F" stroke-width="2" />
        <path d="M100 220 C70 200 32 172 32 100 V37 C48 30 75 24 100 21 C125 24 152 30 168 37 V100 C168 172 130 200 100 220 Z" fill="url(#expShieldDarkGrad)" stroke="url(#expGoldInnerGrad)" stroke-width="3.5" />
        <text x="100" y="56" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="17" letter-spacing="1.5">FRIDAY</text>
        <text x="100" y="75" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" letter-spacing="2">FOOTBALL</text>
        <g transform="translate(105, 78)">
          <circle cx="28" cy="28" r="26" fill="url(#expBallShine)" stroke="#0F172A" stroke-width="2.5" />
          <path d="M28 15 L38 21 L35 32 L21 32 L18 21 Z" fill="#0F172A" />
          <line x1="28" y1="15" x2="28" y2="4" stroke="#0F172A" stroke-width="2" />
          <line x1="38" y1="21" x2="48" y2="15" stroke="#0F172A" stroke-width="2" />
          <line x1="35" y1="32" x2="44" y2="42" stroke="#0F172A" stroke-width="2" />
          <line x1="21" y1="32" x2="12" y2="42" stroke="#0F172A" stroke-width="2" />
          <line x1="18" y1="21" x2="8" y2="15" stroke="#0F172A" stroke-width="2" />
          <path d="M48 15 Q54 28 44 42" stroke="#0F172A" stroke-width="2" fill="none" />
          <path d="M12 42 Q28 54 44 42" stroke="#0F172A" stroke-width="2" fill="none" />
          <path d="M8 15 Q2 28 12 42" stroke="#0F172A" stroke-width="2" fill="none" />
          <path d="M8 15 Q18 4 28 4" stroke="#0F172A" stroke-width="2" fill="none" />
          <path d="M28 4 Q38 4 48 15" stroke="#0F172A" stroke-width="2" fill="none" />
        </g>
        <g transform="translate(42, 92) rotate(-8)">
          <ellipse cx="44" cy="50" rx="38" ry="8" fill="#000000" opacity="0.6" />
          <path d="M10 38 Q30 46 78 36 L80 40 Q30 50 8 40 Z" fill="#D97706" stroke="#78350F" stroke-width="1.5" />
          <rect x="14" y="40" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="24" y="43" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="62" y="38" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="72" y="36" width="4" height="3" fill="#D97706" rx="1" />
          <path d="M8 38 C6 28 12 18 24 16 C30 15 36 20 45 22 C60 25 76 28 82 35 C83 37 81 38 78 37 C60 36 28 45 8 38 Z" fill="url(#expBootWhiteGrad)" stroke="#0F172A" stroke-width="2.5" />
          <path d="M8 38 C6 28 12 18 24 16 C26 22 24 30 18 36 Z" fill="#0F172A" />
          <path d="M26 18 Q36 21 44 24" stroke="#0F172A" stroke-width="2" fill="none" />
          <line x1="28" y1="18" x2="31" y2="24" stroke="#0F172A" stroke-width="1.5" />
          <line x1="33" y1="19" x2="36" y2="25" stroke="#0F172A" stroke-width="1.5" />
          <line x1="38" y1="21" x2="41" y2="27" stroke="#0F172A" stroke-width="1.5" />
          <line x1="43" y1="23" x2="46" y2="29" stroke="#0F172A" stroke-width="1.5" />
          <path d="M70 32 Q78 33 82 35" stroke="#CBD5E1" stroke-width="1.5" fill="none" />
        </g>
        <text x="100" y="178" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="15" letter-spacing="2.5">EST. 2021</text>
        <polygon points="100,188 103,197 112,197 105,203 107,212 100,206 93,212 95,203 88,197 97,197" fill="#FACC15" stroke="#CA8A04" stroke-width="1" />
      </svg>
    </div>
    <div>
      <h2 style="font-size: 15px; font-weight: 900; margin: 0; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px; line-height: 1.2;">FRIDAY FOOTBALL LEAGUE 2.0</h2>
      <p style="font-size: 9px; font-weight: 700; color: #cbd5e1; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.8px;">Individual Points Competition • Est. 2021</p>
    </div>
  </div>
`;

function triggerPrint(htmlContent: string) {
  // Remove existing print iframe if any
  const oldIframe = document.getElementById('print-report-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'print-report-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    return;
  }

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Friday Football League 2.0 Report</title>
  <style>
    @page {
      size: auto;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    thead {
      display: table-header-group !important;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 200);
}

export function exportStandingsCSV(leagueData: LeagueData): void {
  let csv = "Rank,Player Name,Matches Played,Match Wins,On-Time,Attendances,Goals,Own Goals,Penalties,Raw Pts,Best 13 League Pts\n";
  const standings = computeStandings(leagueData);
  
  standings.forEach((item, idx) => {
    const penStr = item.totalPenalties > 0 ? `-${item.totalPenalties}` : "0";
    csv += `"#${idx + 1}","${formatPlayerName(item.player.name)}",${item.matchesPlayed},${item.matchWins},${item.onTimeCount},${item.attendanceCount},${item.totalGoals},${item.totalOwnGoals},${penStr},${item.rawPoints.toFixed(1)},${item.best13Points.toFixed(1)}\n`;
  });
  downloadCSV(csv, "Friday_Football_League_Standings.csv");
}

export function exportStandingsPDF(leagueData: LeagueData): void {
  const standings = computeStandings(leagueData);
  let totalAttendances = 0;
  let totalWins = 0;
  let totalOnTimes = 0;
  let totalGoalsScored = 0;

  standings.forEach(item => {
    totalAttendances += item.attendanceCount;
    totalWins += item.matchWins;
    totalOnTimes += item.onTimeCount;
    totalGoalsScored += item.totalGoals;
  });

  let html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; padding: 16px 20px; background: white; width: 100%; box-sizing: border-box;">
      ${LOGO_HEADER_HTML}
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0;">Official League Standings Report (${standings.length} Players)</h3>
        <p style="font-size: 9px; color: #64748b; margin: 0 0 8px 0;">Best 13 Results Rule Applied. Ties broken by Wins, On-Time Bonuses, and Attendances.</p>
        
        <!-- High Visibility League KPI Summary Cards (Compact & Neat) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 10px 0;">
          <div style="background: #f0fdf4; border: 1.5px solid #059669; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #059669; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">📋</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #065f46;">Total Attendances</div>
              <div style="font-size: 14px; font-weight: 900; color: #047857; line-height: 1.1;">${totalAttendances} <span style="font-size: 9px; font-weight: 700; color: #059669;">Recorded</span></div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⚽</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #166534;">Goals Scored</div>
              <div style="font-size: 14px; font-weight: 900; color: #15803d; line-height: 1.1;">${totalGoalsScored} <span style="font-size: 9px; font-weight: 700; color: #16a34a;">Goals</span></div>
            </div>
          </div>

          <div style="background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #d97706; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">🏆</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #92400e;">Winning Points</div>
              <div style="font-size: 14px; font-weight: 900; color: #b45309; line-height: 1.1;">${totalWins} <span style="font-size: 9px; font-weight: 700; color: #d97706;">Wins</span></div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1.5px solid #2563eb; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #2563eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⏰</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #1e40af;">On-Time Bonuses</div>
              <div style="font-size: 14px; font-weight: 900; color: #1d4ed8; line-height: 1.1;">${totalOnTimes} <span style="font-size: 9px; font-weight: 700; color: #2563eb;">Bonuses</span></div>
            </div>
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: white;">
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 5%; font-weight: 800;">#</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: left; width: 28%; font-weight: 800;">Player Name</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 6%; font-weight: 800;">P</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 6%; font-weight: 800;">W</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 7%; font-weight: 800;">Goals</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 6%; font-weight: 800;">OG</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 8%; font-weight: 800;">On-Time</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 6%; font-weight: 800;">Pen</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: right; width: 12%; font-weight: 800;">Raw Pts</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right; width: 16%; font-weight: 900; color: #fbbf24;">Best 13 Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  standings.forEach((item, index) => {
    const formattedName = formatPlayerName(item.player.name);
    html += `
      <tr style="${index % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; font-size: 9px;">#${index + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 800; color: #0f172a; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedName}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700;">${item.matchesPlayed}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #b45309;">${item.matchWins}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #059669;">${item.totalGoals}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700; color: #dc2626;">${item.totalOwnGoals}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700;">${item.onTimeCount}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700; color: #dc2626;">${item.totalPenalties > 0 ? '-' + item.totalPenalties : '0'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: right; font-weight: 700;">${item.rawPoints.toFixed(1)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 900; font-size: 10.5px; color: #0f172a;">${item.best13Points.toFixed(1)}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  triggerPrint(html);
}

export function exportPlayersCSV(leagueData: LeagueData): void {
  let csv = "No,Player Name,Matches Played,Match Wins,Goals Scored,Own Goals,On-Time,Best 13 League Pts\n";
  leagueData.players.forEach((player, idx) => {
    const stats = calculatePlayerStats(player, leagueData);
    csv += `${idx + 1},"${formatPlayerName(player.name)}",${stats.matchesPlayed},${stats.matchWins},${stats.totalGoals},${stats.totalOwnGoals},${stats.onTimeCount},${stats.best13Points.toFixed(1)}\n`;
  });
  downloadCSV(csv, "Friday_Football_Registered_Players.csv");
}

export function exportPlayersPDF(leagueData: LeagueData): void {
  const standings = computeStandings(leagueData);
  let totalGoalsAcrossAll = 0;
  let completedMatches = 0;
  leagueData.matches.forEach(m => {
    if (m.completed) completedMatches++;
  });
  standings.forEach(s => {
    totalGoalsAcrossAll += s.totalGoals;
  });

  let html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; padding: 16px 20px; background: white; width: 100%; box-sizing: border-box;">
      ${LOGO_HEADER_HTML}
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0;">Registered Players Roster (${leagueData.players.length} Players)</h3>
        <p style="font-size: 9px; color: #64748b; margin: 0 0 8px 0;">Official Friday Football League 2.0 Competitors Directory</p>

        <!-- Compact Roster KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 6px 0 10px 0;">
          <div style="background: #f1f5f9; border: 1.5px solid #64748b; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #475569; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">👥</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #334155;">Registered Players</div>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; line-height: 1.1;">${leagueData.players.length} <span style="font-size: 9px; font-weight: 700; color: #64748b;">Athletes</span></div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⚽</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #166534;">Season Goals</div>
              <div style="font-size: 14px; font-weight: 900; color: #15803d; line-height: 1.1;">${totalGoalsAcrossAll} <span style="font-size: 9px; font-weight: 700; color: #16a34a;">Goals</span></div>
            </div>
          </div>

          <div style="background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #d97706; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">📅</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #92400e;">Matches Scheduled</div>
              <div style="font-size: 14px; font-weight: 900; color: #b45309; line-height: 1.1;">${completedMatches} / ${leagueData.matches.length} <span style="font-size: 9px; font-weight: 700; color: #d97706;">Played</span></div>
            </div>
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: white;">
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 6%; font-weight: 800;">#</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: left; width: 34%; font-weight: 800;">Player Name</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 12%; font-weight: 800;">Matches</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 12%; font-weight: 800;">Wins</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800;">Goals</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800;">Own Goals</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right; width: 16%; font-weight: 900; color: #fbbf24;">Best 13 Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  leagueData.players.forEach((player, idx) => {
    const stats = calculatePlayerStats(player, leagueData);
    const formattedName = formatPlayerName(player.name);
    html += `
      <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; font-size: 9px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 800; color: #0f172a; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedName}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700;">${stats.matchesPlayed}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #b45309;">${stats.matchWins}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #059669;">${stats.totalGoals}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700; color: #dc2626;">${stats.totalOwnGoals}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 900; font-size: 10.5px;">${stats.best13Points.toFixed(1)}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  triggerPrint(html);
}

export function exportPlayerIndividualCSV(player: Player, leagueData: LeagueData): void {
  const stats = calculatePlayerStats(player, leagueData);
  let csv = `Player Performance Report: ${formatPlayerName(player.name)}\n`;
  csv += `Match Week,Date,Attendance,Goals,Own Goals,Match Win,On-Time Bonus,Penalty,Match Score,Best 13 Counted\n`;
  
  stats.matchScores.forEach(ms => {
    const match = leagueData.matches.find(m => m.id === ms.matchId);
    const penStr = ms.details.penalty > 0 ? `-${ms.details.penalty}` : "0";
    const scoreStr = ms.score > 0 ? `+${ms.score.toFixed(1)}` : `${ms.score.toFixed(1)}`;
    csv += `"${ms.matchTitle}","${match?.date || ''}",${ms.details.attendance ? 'Present (+0.5)' : 'Absent'},${ms.details.goals || 0},${ms.details.ownGoals || 0},${ms.details.win ? 'Yes (+1.0)' : 'No'},${ms.details.onTime ? 'Yes (+1.0)' : 'No'},${penStr},${scoreStr},${ms.isExcludedFromBest13 ? 'Excluded (Lowest)' : 'Counted'}\n`;
  });
  
  csv += `\nSummary: Raw Points: ${stats.rawPoints.toFixed(1)}, Best 13 League Points: ${stats.best13Points.toFixed(1)}, Goals: ${stats.totalGoals}, Wins: ${stats.matchWins}\n`;
  downloadCSV(csv, `Player_Report_${player.name.replace(/\s+/g, '_')}.csv`);
}

export function exportPlayerIndividualPDF(player: Player, leagueData: LeagueData): void {
  const stats = calculatePlayerStats(player, leagueData);
  const formattedPlayerName = formatPlayerName(player.name);

  let html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; padding: 16px 20px; background: white; width: 100%; box-sizing: border-box;">
      ${LOGO_HEADER_HTML}
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0;">Player Performance Report: ${formattedPlayerName}</h3>
        <p style="font-size: 9px; color: #64748b; margin: 0 0 8px 0;">Official Match-by-Match Breakdown & Best 13 Calculation</p>
        
        <!-- Compact Player KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 10px 0;">
          <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border: 1.5px solid #fbbf24; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px; color: white;">
            <div style="width: 28px; height: 28px; background: #fbbf24; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #000; font-weight: 900;">⭐</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #fbbf24;">Best 13 Pts</div>
              <div style="font-size: 14px; font-weight: 900; color: #ffffff; line-height: 1.1;">
                ${stats.best13Points.toFixed(1)} <span style="font-size: 9px; font-weight: 700; color: #fbbf24;">Pts</span>
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⚽</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #166534;">Goals Scored</div>
              <div style="font-size: 14px; font-weight: 900; color: #15803d; line-height: 1.1;">
                ${stats.totalGoals} <span style="font-size: 9px; font-weight: 700; color: #16a34a;">Goals</span>
              </div>
            </div>
          </div>

          <div style="background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #d97706; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">🏆</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #92400e;">Match Wins</div>
              <div style="font-size: 14px; font-weight: 900; color: #b45309; line-height: 1.1;">
                ${stats.matchWins} <span style="font-size: 9px; font-weight: 700; color: #d97706;">Wins</span>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1.5px solid #2563eb; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #2563eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⏰</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #1e40af;">Att / On-Time</div>
              <div style="font-size: 13px; font-weight: 900; color: #1d4ed8; line-height: 1.1;">
                ${stats.attendanceCount} Att / ${stats.onTimeCount} On-Time
              </div>
            </div>
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: white;">
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: left; width: 22%; font-weight: 800;">Match Week</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 12%; font-weight: 800;">Attendance</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 8%; font-weight: 800;">Goals</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 8%; font-weight: 800;">OG</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800;">Win</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800;">On-Time</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 8%; font-weight: 800;">Penalty</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right; width: 12%; font-weight: 800;">Score</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (stats.matchScores.length === 0) {
    html += `<tr><td colspan="9" style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: 700; color: #64748b;">No match participation recorded yet.</td></tr>`;
  } else {
    stats.matchScores.forEach(ms => {
      html += `
        <tr style="${ms.isExcludedFromBest13 ? 'background-color: #fee2e2;' : ''}">
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 800; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ms.matchTitle}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700; color: ${ms.details.attendance ? '#059669' : '#64748b'};">${ms.details.attendance ? 'Present (+0.5)' : 'Absent'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #059669;">${ms.details.goals || 0}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700; color: #dc2626;">${ms.details.ownGoals || 0}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700;">${ms.details.win ? 'Yes (+1.0)' : 'No'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700;">${ms.details.onTime ? 'Yes (+1.0)' : 'No'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 800; color: ${ms.details.penalty > 0 ? '#dc2626' : '#64748b'};">${ms.details.penalty > 0 ? '-' + ms.details.penalty : '0'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 900; font-size: 10px; color: ${ms.score < 0 ? '#dc2626' : '#0f172a'};">${ms.score > 0 ? '+' + ms.score.toFixed(1) : ms.score.toFixed(1)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-size: 9px; font-weight: 800;">${ms.isExcludedFromBest13 ? '<span style="color: #dc2626;">Excluded</span>' : '<span style="color: #059669;">Counted</span>'}</td>
        </tr>
      `;
    });
  }

  html += `</tbody></table></div>`;
  triggerPrint(html);
}

export function exportMatchSheetCSV(match: Match, leagueData: LeagueData): void {
  const matchRes = leagueData.matchResults[match.id] || {};
  const ms = match.matchSheet;
  const teamAName = ms?.teamAName || 'Team A';
  const teamBName = ms?.teamBName || 'Team B';
  let winnerLabel = 'Undecided / No Winner';
  if (ms?.winner === 'teamA') winnerLabel = `${teamAName} Won`;
  else if (ms?.winner === 'teamB') winnerLabel = `${teamBName} Won`;
  else if (ms?.winner === 'draw') winnerLabel = 'Draw (Level)';

  let csv = `${match.title} Match Sheet (${match.date} • 6:00 AM – 8:00 AM)\n`;
  if (ms) {
    csv += `Teams: ${teamAName} vs ${teamBName}\n`;
    if (ms.teamAScore !== undefined && ms.teamBScore !== undefined) {
      csv += `Score: ${teamAName} ${ms.teamAScore} - ${ms.teamBScore} ${teamBName}\n`;
    }
    csv += `Outcome: ${winnerLabel}\n\n`;
  }
  csv += `Player Name,Assigned Team,Attendance,Goals,Own Goals,Match Win,On-Time Bonus,Penalty,Total Points\n`;

  // Sort present first, then absent
  const present: Player[] = [];
  const absent: Player[] = [];

  leagueData.players.forEach(player => {
    const r = matchRes[player.id];
    if (r && r.attendance) {
      present.push(player);
    } else {
      absent.push(player);
    }
  });

  present.sort((a, b) => a.name.localeCompare(b.name));
  absent.sort((a, b) => a.name.localeCompare(b.name));
  const sortedPlayers = [...present, ...absent];

  sortedPlayers.forEach(player => {
    const r = matchRes[player.id] || { attendance: false, win: false, onTime: false, penalty: 0, goals: 0, ownGoals: 0 };
    const teamAssign = r.team === 'teamA' ? teamAName : r.team === 'teamB' ? teamBName : 'Unassigned';
    let score = 0;
    if (r.attendance) score += 0.5;
    if (r.win) score += 1.0;
    if (r.onTime) score += 1.0;
    if (r.penalty) score -= r.penalty;

    const scoreStr = score > 0 ? `+${score.toFixed(1)}` : `${score.toFixed(1)}`;
    const penStr = r.penalty > 0 ? `-${r.penalty}` : "0";
    csv += `"${formatPlayerName(player.name)}","${teamAssign}",${r.attendance ? 'Present' : 'Absent'},${r.goals || 0},${r.ownGoals || 0},${r.win ? 'Yes' : 'No'},${r.onTime ? 'Yes' : 'No'},${penStr},${scoreStr}\n`;
  });

  downloadCSV(csv, `Match_${match.id}_Sheet.csv`);
}

export function exportMatchSheetPDF(match: Match, leagueData: LeagueData): void {
  const matchRes = leagueData.matchResults[match.id] || {};
  const ms = match.matchSheet;
  const teamAName = ms?.teamAName || 'Red Team';
  const teamBName = ms?.teamBName || 'Green Team';
  const winner = ms?.winner;

  let attendedCount = 0;
  let winnersCount = 0;
  let ontimeCount = 0;
  let totalMatchGoals = 0;
  let totalMatchOwnGoals = 0;
  let teamAScoredGoals = 0;
  let teamAOwnGoals = 0;
  let teamBScoredGoals = 0;
  let teamBOwnGoals = 0;
  let teamAOnTimeCount = 0;
  let teamBOnTimeCount = 0;
  let teamATotalPoints = 0;
  let teamBTotalPoints = 0;

  interface PlayerWithRecord {
    player: Player;
    record: PlayerMatchRecord;
  }

  const teamAPlayers: PlayerWithRecord[] = [];
  const teamBPlayers: PlayerWithRecord[] = [];
  const unassignedPlayers: PlayerWithRecord[] = [];

  leagueData.players.forEach(player => {
    const r = matchRes[player.id];
    if (r && r.attendance) {
      attendedCount++;
      if (r.win) winnersCount++;
      if (r.onTime) ontimeCount++;
      if (r.goals) totalMatchGoals += Number(r.goals) || 0;
      if (r.ownGoals) totalMatchOwnGoals += Number(r.ownGoals) || 0;

      let pPts = 0.5;
      if (r.win) pPts += 1.0;
      if (r.onTime) pPts += 1.0;
      if (r.penalty) pPts -= Number(r.penalty) || 0;

      if (r.team === 'teamA') {
        teamAPlayers.push({ player, record: r });
        if (r.goals) teamAScoredGoals += Number(r.goals) || 0;
        if (r.ownGoals) teamAOwnGoals += Number(r.ownGoals) || 0;
        if (r.onTime) teamAOnTimeCount++;
        teamATotalPoints += pPts;
      } else if (r.team === 'teamB') {
        teamBPlayers.push({ player, record: r });
        if (r.goals) teamBScoredGoals += Number(r.goals) || 0;
        if (r.ownGoals) teamBOwnGoals += Number(r.ownGoals) || 0;
        if (r.onTime) teamBOnTimeCount++;
        teamBTotalPoints += pPts;
      } else {
        unassignedPlayers.push({ player, record: r });
      }
    }
  });

  const teamAGoalsCount = teamAScoredGoals + teamBOwnGoals;
  const teamBGoalsCount = teamBScoredGoals + teamAOwnGoals;

  teamAPlayers.sort((a, b) => a.player.name.localeCompare(b.player.name));
  teamBPlayers.sort((a, b) => a.player.name.localeCompare(b.player.name));

  const teamAScore = ms?.teamAScore !== undefined ? ms.teamAScore : teamAGoalsCount;
  const teamBScore = ms?.teamBScore !== undefined ? ms.teamBScore : teamBGoalsCount;

  const winnerText = winner === 'teamA' 
    ? `🔴 ${teamAName} (Red) won ${match.title} on Friday ${match.date}`
    : winner === 'teamB'
    ? `🟢 ${teamBName} (Green) won ${match.title} on Friday ${match.date}`
    : winner === 'draw'
    ? `🤝 Draw match between 🔴 ${teamAName} & 🟢 ${teamBName} on Friday ${match.date}`
    : null;

  let html = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 12px 14px; background: white; width: 100%; box-sizing: border-box;">
      
      <!-- 1. Official League Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 52px; flex-shrink: 0;">
            <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <defs>
                <linearGradient id="msGoldBorder" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#FDE047" />
                  <stop offset="25%" stop-color="#EAB308" />
                  <stop offset="50%" stop-color="#CA8A04" />
                  <stop offset="75%" stop-color="#FACC15" />
                  <stop offset="100%" stop-color="#A16207" />
                </linearGradient>
                <linearGradient id="msGoldInner" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#FEF08A" />
                  <stop offset="50%" stop-color="#EAB308" />
                  <stop offset="100%" stop-color="#854D0E" />
                </linearGradient>
                <radialGradient id="msShieldDark" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stop-color="#1E293B" />
                  <stop offset="60%" stop-color="#0F172A" />
                  <stop offset="100%" stop-color="#020617" />
                </radialGradient>
                <linearGradient id="msBootWhite" x1="40" y1="90" x2="150" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#FFFFFF" />
                  <stop offset="70%" stop-color="#E2E8F0" />
                  <stop offset="100%" stop-color="#94A3B8" />
                </linearGradient>
                <radialGradient id="msBallShine" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stop-color="#FFFFFF" />
                  <stop offset="60%" stop-color="#E2E8F0" />
                  <stop offset="100%" stop-color="#64748B" />
                </radialGradient>
              </defs>
              <path d="M100 232 C65 210 20 180 20 100 V30 C20 26 40 20 100 12 C160 20 180 26 180 30 V100 C180 180 135 210 100 232 Z" fill="url(#msGoldBorder)" stroke="#78350F" stroke-width="2" />
              <path d="M100 220 C70 200 32 172 32 100 V37 C48 30 75 24 100 21 C125 24 152 30 168 37 V100 C168 172 130 200 100 220 Z" fill="url(#msShieldDark)" stroke="url(#msGoldInner)" stroke-width="3.5" />
              <text x="100" y="56" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="17" letter-spacing="1.5">FRIDAY</text>
              <text x="100" y="75" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" letter-spacing="2">FOOTBALL</text>
              <g transform="translate(105, 78)">
                <circle cx="28" cy="28" r="26" fill="url(#msBallShine)" stroke="#0F172A" stroke-width="2.5" />
                <path d="M28 15 L38 21 L35 32 L21 32 L18 21 Z" fill="#0F172A" />
                <line x1="28" y1="15" x2="28" y2="4" stroke="#0F172A" stroke-width="2" />
                <line x1="38" y1="21" x2="48" y2="15" stroke="#0F172A" stroke-width="2" />
                <line x1="35" y1="32" x2="44" y2="42" stroke="#0F172A" stroke-width="2" />
                <line x1="21" y1="32" x2="12" y2="42" stroke="#0F172A" stroke-width="2" />
                <line x1="18" y1="21" x2="8" y2="15" stroke="#0F172A" stroke-width="2" />
                <path d="M48 15 Q54 28 44 42" stroke="#0F172A" stroke-width="2" fill="none" />
                <path d="M12 42 Q28 54 44 42" stroke="#0F172A" stroke-width="2" fill="none" />
                <path d="M8 15 Q2 28 12 42" stroke="#0F172A" stroke-width="2" fill="none" />
                <path d="M8 15 Q18 4 28 4" stroke="#0F172A" stroke-width="2" fill="none" />
                <path d="M28 4 Q38 4 48 15" stroke="#0F172A" stroke-width="2" fill="none" />
              </g>
              <g transform="translate(42, 92) rotate(-8)">
                <ellipse cx="44" cy="50" rx="38" ry="8" fill="#000000" opacity="0.6" />
                <path d="M10 38 Q30 46 78 36 L80 40 Q30 50 8 40 Z" fill="#D97706" stroke="#78350F" stroke-width="1.5" />
                <rect x="14" y="40" width="4" height="3" fill="#D97706" rx="1" />
                <rect x="24" y="43" width="4" height="3" fill="#D97706" rx="1" />
                <rect x="62" y="38" width="4" height="3" fill="#D97706" rx="1" />
                <rect x="72" y="36" width="4" height="3" fill="#D97706" rx="1" />
                <path d="M8 38 C6 28 12 18 24 16 C30 15 36 20 45 22 C60 25 76 28 82 35 C83 37 81 38 78 37 C60 36 28 45 8 38 Z" fill="url(#msBootWhiteGrad)" stroke="#0F172A" stroke-width="2.5" />
                <path d="M8 38 C6 28 12 18 24 16 C26 22 24 30 18 36 Z" fill="#0F172A" />
                <path d="M26 18 Q36 21 44 24" stroke="#0F172A" stroke-width="2" fill="none" />
                <line x1="28" y1="18" x2="31" y2="24" stroke="#0F172A" stroke-width="1.5" />
                <line x1="33" y1="19" x2="36" y2="25" stroke="#0F172A" stroke-width="1.5" />
                <line x1="38" y1="21" x2="41" y2="27" stroke="#0F172A" stroke-width="1.5" />
                <line x1="43" y1="23" x2="46" y2="29" stroke="#0F172A" stroke-width="1.5" />
                <path d="M70 32 Q78 33 82 35" stroke="#CBD5E1" stroke-width="1.5" fill="none" />
              </g>
              <text x="100" y="178" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="15" letter-spacing="2.5">EST. 2021</text>
              <polygon points="100,188 103,197 112,197 105,203 107,212 100,206 93,212 95,203 88,197 97,197" fill="#FACC15" stroke="#CA8A04" stroke-width="1" />
            </svg>
          </div>
          <div>
            <h1 style="font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; line-height: 1.2;">FRIDAY FOOTBALL LEAGUE 2.0</h1>
            <h2 style="font-size: 11px; font-weight: 900; color: #78350f; text-transform: uppercase; margin: 2px 0 0 0;">OFFICIAL MATCH & SQUAD TEAM SHEET • ${match.title.toUpperCase()}</h2>
            <p style="font-size: 9px; font-weight: 600; color: #475569; margin: 2px 0 0 0;">Friday, ${match.date} • 6:00 AM – 8:00 AM • Main Turf Ground</p>
          </div>
        </div>
        <div style="text-align: right; font-size: 9px; color: #475569;">
          <div style="font-weight: 900; color: #0f172a; text-transform: uppercase;">STATUS: <span style="color: ${match.completed ? '#047857' : '#d97706'};">${match.completed ? 'OFFICIAL FINAL' : 'SCHEDULED MATCH'}</span></div>
          <div>Doc ID: <strong>FFL-2026-M${match.id}</strong></div>
          <div>Date Printed: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <!-- 2. Official Match Scoreboard & Outcome Banner -->
      <div style="background: #f8fafc; border: 2px solid #1e293b; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          
          <!-- Red Team Box -->
          <div style="flex: 1; background: #fff1f2; border: 1.5px solid #fda4af; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">🔴</span>
              <div>
                <div style="font-size: 12px; font-weight: 900; color: #881337; text-transform: uppercase;">${teamAName}</div>
                <div style="font-size: 9.5px; font-weight: 700; color: #9f1239;">Red Jersey • ${teamAPlayers.length} Players</div>
              </div>
            </div>
            ${winner === 'teamA' ? '<span style="background: #be123c; color: white; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">🏆 WINNER</span>' : ''}
          </div>

          <!-- Score -->
          <div style="text-align: center; padding: 0 12px; min-width: 110px;">
            <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; line-height: 1;">
              <span style="color: #be123c;">${teamAScore}</span>
              <span style="color: #94a3b8; margin: 0 4px;">:</span>
              <span style="color: #047857;">${teamBScore}</span>
            </div>
            <div style="font-size: 8.5px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">MATCH RESULT</div>
          </div>

          <!-- Green Team Box -->
          <div style="flex: 1; background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
            ${winner === 'teamB' ? '<span style="background: #047857; color: white; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">🏆 WINNER</span>' : '<span></span>'}
            <div style="display: flex; align-items: center; gap: 8px; text-align: right;">
              <div>
                <div style="font-size: 12px; font-weight: 900; color: #064e3b; text-transform: uppercase;">${teamBName}</div>
                <div style="font-size: 9.5px; font-weight: 700; color: #047857;">Green Jersey • ${teamBPlayers.length} Players</div>
              </div>
              <span style="font-size: 16px;">🟢</span>
            </div>
          </div>
        </div>

        ${winnerText ? `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #cbd5e1; font-size: 10px; font-weight: 800; text-align: center; color: #1e293b;">
            🏆 ${winnerText}
          </div>
        ` : ''}
      </div>

      <!-- 3. Key Match Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; text-align: center;">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Total Turnout</div>
          <div style="font-size: 13px; font-weight: 900; color: #065f46;">${attendedCount} Players</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Match Winners</div>
          <div style="font-size: 13px; font-weight: 900; color: #92400e;">${winnersCount} Players</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">On-Time Arrivals</div>
          <div style="font-size: 13px; font-weight: 900; color: #1e40af;">${ontimeCount} Players</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">
            ${totalMatchOwnGoals > 0 ? `Total Goals (${totalMatchGoals} + ${totalMatchOwnGoals} OG)` : 'Total Goals'}
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${totalMatchGoals + totalMatchOwnGoals} Goals</div>
        </div>
      </div>

      <!-- 4. Side-by-Side Official Team Squads -->
      <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;">
        
        <!-- RED TEAM TABLE -->
        <div style="flex: 1; border: 2px solid #be123c; border-radius: 8px; overflow: hidden; background: white;">
          <div style="background: #be123c; color: white; padding: 6px 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">🔴 ${teamAName.toUpperCase()} (RED JERSEY)</div>
            <span style="font-size: 9px; font-weight: 800; background: white; color: #881337; padding: 1px 6px; border-radius: 10px;">
              ${teamAPlayers.length} Players • ${teamAGoalsCount} Goals ${teamBOwnGoals > 0 ? `(${teamAScoredGoals} + ${teamBOwnGoals} OG)` : ''}
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
            <thead>
              <tr style="background: #fff1f2; color: #881337; border-bottom: 1px solid #fecdd3; font-size: 8.5px; text-transform: uppercase; font-weight: 900;">
                <th style="padding: 4px 5px; text-align: center; width: 6%;">#</th>
                <th style="padding: 4px 6px; text-align: left; width: 40%;">Player Name</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Att</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Win</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Time</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Goal</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">OG</th>
                <th style="padding: 4px 6px; text-align: right; width: 14%;">Pts</th>
              </tr>
            </thead>
            <tbody>
  `;

  if (teamAPlayers.length === 0) {
    html += `<tr><td colspan="8" style="padding: 10px; text-align: center; color: #64748b; font-style: italic; font-size: 9px;">No players assigned to ${teamAName}</td></tr>`;
  } else {
    teamAPlayers.forEach(({ player, record }, idx) => {
      let pPts = 0.5;
      if (record.win) pPts += 1.0;
      if (record.onTime) pPts += 1.0;
      if (record.penalty) pPts -= record.penalty;

      html += `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 3px 5px; text-align: center; font-weight: 700; color: #64748b; font-size: 8.5px;">${idx + 1}</td>
          <td style="padding: 3px 6px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${formatPlayerName(player.name)}</td>
          <td style="padding: 3px 4px; text-align: center; color: #047857; font-weight: 800;">✓</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #b45309;">${record.win ? '🏆' : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #1d4ed8;">${record.onTime ? '⏰' : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 900; color: #047857;">${record.goals > 0 ? '⚽' + record.goals : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #dc2626;">${record.ownGoals > 0 ? '🥅' + record.ownGoals : '—'}</td>
          <td style="padding: 3px 6px; text-align: right; font-weight: 900; color: #0f172a;">+${pPts.toFixed(1)}</td>
        </tr>
      `;
    });
  }

  html += `
            </tbody>
            <tfoot>
              <tr style="background: #fff1f2; border-top: 1.5px solid #fda4af; font-weight: 900; font-size: 9px; color: #881337;">
                <td colspan="2" style="padding: 4px 6px;">Red Team Totals:</td>
                <td style="padding: 4px 4px; text-align: center;">${teamAPlayers.length}</td>
                <td style="padding: 4px 4px; text-align: center;">${winner === 'teamA' ? teamAPlayers.length : 0}</td>
                <td style="padding: 4px 4px; text-align: center;">${teamAOnTimeCount}</td>
                <td style="padding: 4px 4px; text-align: center;">${teamAScoredGoals}</td>
                <td style="padding: 4px 4px; text-align: center; color: #dc2626;">${teamAOwnGoals > 0 ? teamAOwnGoals : 0}</td>
                <td style="padding: 4px 6px; text-align: right;">+${teamATotalPoints.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- GREEN TEAM TABLE -->
        <div style="flex: 1; border: 2px solid #047857; border-radius: 8px; overflow: hidden; background: white;">
          <div style="background: #047857; color: white; padding: 6px 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">🟢 ${teamBName.toUpperCase()} (GREEN JERSEY)</div>
            <span style="font-size: 9px; font-weight: 800; background: white; color: #064e3b; padding: 1px 6px; border-radius: 10px;">
              ${teamBPlayers.length} Players • ${teamBGoalsCount} Goals ${teamAOwnGoals > 0 ? `(${teamBScoredGoals} + ${teamAOwnGoals} OG)` : ''}
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
            <thead>
              <tr style="background: #ecfdf5; color: #064e3b; border-bottom: 1px solid #a7f3d0; font-size: 8.5px; text-transform: uppercase; font-weight: 900;">
                <th style="padding: 4px 5px; text-align: center; width: 6%;">#</th>
                <th style="padding: 4px 6px; text-align: left; width: 40%;">Player Name</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Att</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Win</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Time</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">Goal</th>
                <th style="padding: 4px 4px; text-align: center; width: 9%;">OG</th>
                <th style="padding: 4px 6px; text-align: right; width: 14%;">Pts</th>
              </tr>
            </thead>
            <tbody>
  `;

  if (teamBPlayers.length === 0) {
    html += `<tr><td colspan="8" style="padding: 10px; text-align: center; color: #64748b; font-style: italic; font-size: 9px;">No players assigned to ${teamBName}</td></tr>`;
  } else {
    teamBPlayers.forEach(({ player, record }, idx) => {
      let pPts = 0.5;
      if (record.win) pPts += 1.0;
      if (record.onTime) pPts += 1.0;
      if (record.penalty) pPts -= record.penalty;

      html += `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 3px 5px; text-align: center; font-weight: 700; color: #64748b; font-size: 8.5px;">${idx + 1}</td>
          <td style="padding: 3px 6px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${formatPlayerName(player.name)}</td>
          <td style="padding: 3px 4px; text-align: center; color: #047857; font-weight: 800;">✓</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #b45309;">${record.win ? '🏆' : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #1d4ed8;">${record.onTime ? '⏰' : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 900; color: #047857;">${record.goals > 0 ? '⚽' + record.goals : '—'}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 800; color: #dc2626;">${record.ownGoals > 0 ? '🥅' + record.ownGoals : '—'}</td>
          <td style="padding: 3px 6px; text-align: right; font-weight: 900; color: #0f172a;">+${pPts.toFixed(1)}</td>
        </tr>
      `;
    });
  }

  html += `
            </tbody>
            <tfoot>
              <tr style="background: #ecfdf5; border-top: 1.5px solid #a7f3d0; font-weight: 900; font-size: 9px; color: #064e3b;">
                <td colspan="2" style="padding: 4px 6px;">Green Team Totals:</td>
                <td style="padding: 4px 4px; text-align: center;">${teamBPlayers.length}</td>
                <td style="padding: 4px 4px; text-align: center;">${winner === 'teamB' ? teamBPlayers.length : 0}</td>
                <td style="padding: 4px 4px; text-align: center;">${teamBOnTimeCount}</td>
                <td style="padding: 4px 4px; text-align: center;">${teamBScoredGoals}</td>
                <td style="padding: 4px 4px; text-align: center; color: #dc2626;">${teamAOwnGoals > 0 ? teamAOwnGoals : 0}</td>
                <td style="padding: 4px 6px; text-align: right;">+${teamBTotalPoints.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
  `;

  if (unassignedPlayers.length > 0) {
    html += `
      <div style="background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 9px;">
        <span style="font-weight: 800; color: #475569;">🪑 Bench / Unassigned Attendees (${unassignedPlayers.length}): </span>
        <span style="color: #1e293b;">${unassignedPlayers.map(p => formatPlayerName(p.player.name)).join(', ')}</span>
      </div>
    `;
  }

  html += `
      <!-- 5. Certification & Sign-off Footer -->
      <div style="margin-top: 10px; padding-top: 8px; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #475569;">
        <div style="max-width: 45%;">
          <div style="font-weight: 900; color: #0f172a; text-transform: uppercase;">Scoring Formula:</div>
          <div>Attendance = +0.5 | Win = +1.0 | On-Time = +1.0 (Max +2.5 pts)</div>
          ${totalMatchOwnGoals > 0 ? '<div style="font-weight: 700; color: #0f172a; margin-top: 2px;">*Own Goal Rule: Own goals count towards opposing team score.</div>' : ''}
        </div>
        <div style="text-align: center; min-width: 140px;">
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 4px; height: 16px;"></div>
          <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 8.5px;">🔴 ${teamAName} Captain Sign-off</div>
        </div>
        <div style="text-align: right; min-width: 140px;">
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 4px; height: 16px;"></div>
          <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 8.5px;">Referee / Scorer Sign-off</div>
        </div>
      </div>

    </div>
  `;

  triggerPrint(html);
}
