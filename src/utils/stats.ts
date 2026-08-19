import { LeagueData, Player, PlayerMatchRecord, PlayerStanding, PlayerStats, MatchScoreDetail } from '../types';

export function calculatePlayerStats(player: Player, leagueData: LeagueData): PlayerStats {
  let matchesPlayed = 0;
  let matchWins = 0;
  let onTimeCount = 0;
  let attendanceCount = 0;
  let totalGoals = 0;
  let totalOwnGoals = 0;
  let totalPenalties = 0;
  let rawEarnedPoints = 0;
  const matchScores: MatchScoreDetail[] = [];

  leagueData.matches.forEach(match => {
    const matchRes = leagueData.matchResults[match.id];
    if (matchRes && matchRes[player.id]) {
      const r = matchRes[player.id];
      let earnedMatchScore = 0;
      
      const hasAttended = Boolean(r.attendance);
      const hasWon = Boolean(r.win);
      const isOntime = Boolean(r.onTime);
      const goals = Number(r.goals) || 0;
      const ownGoals = Number(r.ownGoals) || 0;
      const penalty = Math.max(0, Number(r.penalty) || 0);

      if (hasAttended) {
        matchesPlayed++;
        attendanceCount++;
        earnedMatchScore += 0.5;
      }
      if (hasWon) {
        matchWins++;
        earnedMatchScore += 1.0;
      }
      if (isOntime) {
        onTimeCount++;
        earnedMatchScore += 1.0;
      }
      
      totalGoals += goals;
      totalOwnGoals += ownGoals;
      totalPenalties += penalty;

      const netMatchScore = earnedMatchScore - penalty;
      rawEarnedPoints += earnedMatchScore;

      // Only include this match in the player's breakdown if the player had actual participation
      // (attended, goals scored, own goals, penalty deduction, win or on-time)
      const hasParticipation = hasAttended || goals > 0 || ownGoals > 0 || penalty > 0 || hasWon || isOntime;

      if (hasParticipation) {
        matchScores.push({
          matchId: match.id,
          matchTitle: match.title,
          score: netMatchScore,
          details: {
            attendance: hasAttended,
            win: hasWon,
            onTime: isOntime,
            goals,
            ownGoals,
            penalty
          }
        });
      }
    }
  });

  // Calculate Raw Points with penalty points deducted from the player's points
  const rawPoints = rawEarnedPoints - totalPenalties;

  // Calculate Best 13 Results
  // Sort by earned match performance to drop lowest scoring matches when 14 or 15 matches are played
  const matchEarnedList = matchScores.map(ms => {
    const d = ms.details;
    const earned = (d.attendance ? 0.5 : 0) + (d.win ? 1.0 : 0) + (d.onTime ? 1.0 : 0);
    return { ...ms, earned };
  });

  const sortedByEarned = [...matchEarnedList].sort((a, b) => a.earned - b.earned);
  let best13Earned = rawEarnedPoints;
  const excludedMatchIds = new Set<number>();

  if (matchesPlayed > 13) {
    const numToExclude = matchesPlayed - 13;
    let excludedSum = 0;
    for (let i = 0; i < numToExclude && i < sortedByEarned.length; i++) {
      excludedSum += sortedByEarned[i].earned;
      excludedMatchIds.add(sortedByEarned[i].matchId);
    }
    best13Earned = rawEarnedPoints - excludedSum;
  }

  // Deduct penalty points directly from Best 13 League points
  const best13Points = best13Earned - totalPenalties;

  // Mark excluded matches
  const formattedScores = matchScores.map(ms => ({
    ...ms,
    isExcludedFromBest13: excludedMatchIds.has(ms.matchId)
  }));

  return {
    matchesPlayed,
    matchWins,
    onTimeCount,
    attendanceCount,
    totalGoals,
    totalOwnGoals,
    totalPenalties,
    rawPoints,
    best13Points,
    matchScores: formattedScores
  };
}

export function computeStandings(leagueData: LeagueData): PlayerStanding[] {
  const standings: PlayerStanding[] = leagueData.players.map(player => {
    const stats = calculatePlayerStats(player, leagueData);
    return {
      player,
      ...stats
    };
  });

  standings.sort((a, b) => {
    // 1. Best 13 Points (after penalty deductions)
    if (b.best13Points !== a.best13Points) {
      return b.best13Points - a.best13Points;
    }
    // 2. Most Match Wins
    if (b.matchWins !== a.matchWins) {
      return b.matchWins - a.matchWins;
    }
    // 3. Highest Number of On-Time Bonuses
    if (b.onTimeCount !== a.onTimeCount) {
      return b.onTimeCount - a.onTimeCount;
    }
    // 4. Highest Number of Attendances
    if (b.attendanceCount !== a.attendanceCount) {
      return b.attendanceCount - a.attendanceCount;
    }
    // 5. Total Goals Scored
    if (b.totalGoals !== a.totalGoals) {
      return b.totalGoals - a.totalGoals;
    }
    // 6. Least Penalties
    if (a.totalPenalties !== b.totalPenalties) {
      return a.totalPenalties - b.totalPenalties;
    }
    // 7. Name alphabetical
    return a.player.name.localeCompare(b.player.name);
  });

  return standings.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}
