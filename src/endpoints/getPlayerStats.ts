import { FullPlayerStats } from '../models/FullPlayerStats'
import { Team } from '../models/Team'
import { stringify } from 'querystring'
import { HLTVConfig } from '../config'
import { MatchType } from '../enums/MatchType'
import { RankingFilter } from '../enums/RankingFilter'
import { fetchPage } from '../utils/mappers'
import { popSlashSource } from '../utils/parsing'

export const getPlayerStats = (config: HLTVConfig) => async ({
  id,
  startDate,
  endDate,
  matchType,
  rankingFilter
}: {
  id: number
  startDate: string
  endDate: string
  matchType: MatchType
  rankingFilter: RankingFilter
}): Promise<FullPlayerStats> => {
  const query = stringify({
    startDate,
    endDate,
    matchType,
    rankingFilter
  })

  const $ = await fetchPage(`${config.hltvUrl}/stats/players/${id}/-?${query}`, config.loadPage)

  const name = $('.statsPlayerName').text() || undefined
  const ign = $('.context-item-name').text()

  const image = $('.context-item-image').attr('src')

  const getInfo = i => {
    return $(
      $('.divided-row')
        .find('.large-strong')
        .get(i)
    )
  }
  const age = Number(getInfo(1).text()) || undefined

  const country = {
    name: getInfo(2).text(),
    code: popSlashSource($('.image-and-label .flag'))!.split('.')[0]
  }

  let team: Team | undefined

  if (getInfo(3).text() !== 'No team') {
    team = {
      name: getInfo(3).text(),
      id: Number(
        getInfo(3)
          .attr('href')
          .split('/')[3]
      )
    }
  }

  const getStats = i => {
    return $(
      $($('.stats-row').get(i))
        .find('span')
        .get(1)
    ).text()
  }
  const statistics = {
    kills: getStats(0),
    headshots: getStats(1),
    deaths: getStats(2),
    kdRatio: getStats(3),
    damagePerRound: getStats(4),
    grenadeDamagePerRound: getStats(5),
    mapsPlayed: getStats(6),
    roundsPlayed: getStats(7),
    killsPerRound: getStats(8),
    assistsPerRound: getStats(9),
    deathsPerRound: getStats(10),
    savedByTeammatePerRound: getStats(11),
    savedTeammatesPerRound: getStats(12),
    rating: getStats(13)
  }

  return { name, ign, image, age, country, team, statistics }
}
