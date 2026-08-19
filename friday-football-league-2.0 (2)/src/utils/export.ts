import { formatPlayerName } from '../constants';
import { LeagueData, Match, Player } from '../types';
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
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 2px solid #d97706; padding: 10px 14px; background: #0f172a; border-radius: 8px; color: white;">
    <div style="width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, #fbbf24, #d97706); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #000;">⚽</div>
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
  const teamAName = ms?.teamAName || 'Team Gaza';
  const teamBName = ms?.teamBName || 'Team Rashu';
  let winnerBanner = '';
  if (ms?.winner === 'teamA') {
    winnerBanner = `<div style="background: #fef3c7; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 12px; margin-bottom: 8px; font-weight: 800; color: #92400e; font-size: 11px;">🏆 WINNER: <strong>${teamAName}</strong> won ${match.title} on Friday ${match.date}</div>`;
  } else if (ms?.winner === 'teamB') {
    winnerBanner = `<div style="background: #fef3c7; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 12px; margin-bottom: 8px; font-weight: 800; color: #92400e; font-size: 11px;">🏆 WINNER: <strong>${teamBName}</strong> won ${match.title} on Friday ${match.date}</div>`;
  } else if (ms?.winner === 'draw') {
    winnerBanner = `<div style="background: #eff6ff; border: 1.5px solid #3b82f6; border-radius: 6px; padding: 6px 12px; margin-bottom: 8px; font-weight: 800; color: #1e40af; font-size: 11px;">🤝 RESULT: Draw (${teamAName} ${ms.teamAScore ?? 0} - ${ms.teamBScore ?? 0} ${teamBName}) on Friday ${match.date}</div>`;
  }

  let attendedCount = 0;
  let winsCount = 0;
  let onTimeCount = 0;
  let totalGoals = 0;

  const present: Player[] = [];
  const absent: Player[] = [];

  leagueData.players.forEach(player => {
    const r = matchRes[player.id];
    if (r && r.attendance) {
      attendedCount++;
      if (r.win) winsCount++;
      if (r.onTime) onTimeCount++;
      totalGoals += Number(r.goals) || 0;
      present.push(player);
    } else {
      absent.push(player);
    }
  });

  present.sort((a, b) => a.name.localeCompare(b.name));
  absent.sort((a, b) => a.name.localeCompare(b.name));
  const sortedPlayers = [...present, ...absent];

  let html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; padding: 16px 20px; background: white; width: 100%; box-sizing: border-box;">
      ${LOGO_HEADER_HTML}
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0;">${match.title} Official Match Sheet</h3>
            <p style="font-size: 9px; color: #64748b; margin: 0;">Fixture Date: ${match.date} • Match Hours: 6:00 AM – 8:00 AM</p>
          </div>
          ${ms ? `
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${teamAName} ${ms.teamAScore !== undefined ? ms.teamAScore : ''} vs ${ms.teamBScore !== undefined ? ms.teamBScore : ''} ${teamBName}</div>
            </div>
          ` : ''}
        </div>

        ${winnerBanner}

        <!-- Compact Match Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 10px 0;">
          <div style="background: #f0fdf4; border: 1.5px solid #059669; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #059669; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">👥</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #065f46;">Attended</div>
              <div style="font-size: 14px; font-weight: 900; color: #047857; line-height: 1.1;">
                ${attendedCount} <span style="font-size: 9px; font-weight: 700; color: #059669;">Players</span>
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #16a34a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⚽</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #166534;">Total Goals</div>
              <div style="font-size: 14px; font-weight: 900; color: #15803d; line-height: 1.1;">
                ${totalGoals} <span style="font-size: 9px; font-weight: 700; color: #16a34a;">Goals</span>
              </div>
            </div>
          </div>

          <div style="background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #d97706; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">🏆</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #92400e;">Match Winners</div>
              <div style="font-size: 14px; font-weight: 900; color: #b45309; line-height: 1.1;">
                ${winsCount} <span style="font-size: 9px; font-weight: 700; color: #d97706;">Winners</span>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1.5px solid #2563eb; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #2563eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">⏰</div>
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #1e40af;">On-Time</div>
              <div style="font-size: 14px; font-weight: 900; color: #1d4ed8; line-height: 1.1;">
                ${onTimeCount} <span style="font-size: 9px; font-weight: 700; color: #2563eb;">On-Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: white;">
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: left; width: 24%; font-weight: 800;">Player Name</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 14%; font-weight: 800;">Team</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 11%; font-weight: 800;">Att (+0.5)</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 7%; font-weight: 800;">Goals</th>
            <th style="border: 1px solid #334155; padding: 5px 3px; text-align: center; width: 7%; font-weight: 800;">OG</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 9%; font-weight: 800;">Win (+1.0)</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 9%; font-weight: 800;">On-Time</th>
            <th style="border: 1px solid #334155; padding: 5px 4px; text-align: center; width: 7%; font-weight: 800;">Pen</th>
            <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right; width: 12%; font-weight: 900; color: #fbbf24;">Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedPlayers.forEach(player => {
    const r = matchRes[player.id] || { attendance: false, win: false, onTime: false, penalty: 0, goals: 0, ownGoals: 0 };
    const teamAssign = r.team === 'teamA' ? teamAName : r.team === 'teamB' ? teamBName : '—';
    let score = 0;
    if (r.attendance) score += 0.5;
    if (r.win) score += 1.0;
    if (r.onTime) score += 1.0;
    if (r.penalty) score -= r.penalty;

    const formattedName = formatPlayerName(player.name);
    const scoreStr = score > 0 ? `+${score.toFixed(1)} Pts` : `${score.toFixed(1)} Pts`;

    html += `
      <tr style="${r.attendance ? 'background-color: #f0fdf4;' : ''}">
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 800; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedName}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700; font-size: 9px; color: ${r.team === 'teamA' ? '#b45309' : r.team === 'teamB' ? '#047857' : '#64748b'};">${teamAssign}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 800; color: ${r.attendance ? '#059669' : '#64748b'};">${r.attendance ? 'Present' : 'Absent'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 800; color: #059669;">${r.goals || 0}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 3px; text-align: center; font-weight: 700; color: #dc2626;">${r.ownGoals || 0}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700;">${r.win ? 'Yes' : 'No'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 700;">${r.onTime ? 'Yes' : 'No'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 4px; text-align: center; font-weight: 800; color: ${r.penalty > 0 ? '#dc2626' : '#64748b'};">${r.penalty > 0 ? '-' + r.penalty : '0'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 900; font-size: 10px; color: ${score < 0 ? '#dc2626' : '#0f172a'};">${scoreStr}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  triggerPrint(html);
}
