import { HLTVConfig } from '../config'
import { fetchPage, toArray } from '../utils/mappers'
import { EventResult } from '../models/EventResult'
import { EventSize } from '../enums/EventSize'
import { EventType } from '../enums/EventType'
import { SimpleEvent } from '../models/SimpleEvent'

export const getEvents = (config: HLTVConfig) => async ({
  size,
  month
}: {
  size?: EventSize
  month?: Number
} = {}): Promise<EventResult[]> => {
  const $ = await fetchPage(`${config.hltvUrl}/events`, config.loadPage)

  const events = toArray($('.events-month'))
    .map(eventEl => {
      const checkMonth = new Date(eventEl.find('.standard-headline').text()).getMonth()

      if (typeof month === 'undefined' || (typeof month !== 'undefined' && month == checkMonth)) {
        switch (size) {
          case EventSize.Small:
            return {
              month: checkMonth,
              events: parseEvents(toArray(eventEl.find('a.small-event')), EventSize.Small)
            }

          case EventSize.Big:
            return {
              month: checkMonth,
              events: parseEvents(toArray(eventEl.find('a.big-event')), EventSize.Big)
            }

          default:
            return {
              month: checkMonth,
              events: parseEvents(toArray(eventEl.find('a.big-event'))).concat(
                parseEvents(toArray(eventEl.find('a.small-event')))
              )
            }
        }
      }

      return null
    })
    .filter((x): x is EventResult => !!x)

  return events
}

const parseEvents = (eventsToParse: Cheerio[], size?: EventSize): SimpleEvent[] => {
  let dateSelector: any,
    nameSelector: any,
    locationSelector = ''

  if (size == EventSize.Small) {
    dateSelector = '.eventDetails .col-desc span[data-unix]'
    nameSelector = '.col-value .text-ellipsis'
    locationSelector = '.smallCountry img'
  } else {
    dateSelector = 'span[data-unix]'
    nameSelector = '.big-event-name'
    locationSelector = '.location-top-teams img'
  }

  const events = eventsToParse.map(eventEl => {
    let dateStart = eventEl
      .find(dateSelector)
      .eq(0)
      .data('unix')
    let dateEnd = eventEl
      .find(dateSelector)
      .eq(1)
      .data('unix')
    let teams = '0'
    let prizePool = ''

    if (size == EventSize.Small) {
      teams = eventEl
        .find('.col-value')
        .eq(1)
        .text()
      prizePool = eventEl.find('.prizePoolEllipsis').text()
    } else {
      teams = eventEl
        .find('.additional-info tr')
        .eq(0)
        .find('td')
        .eq(2)
        .text()
      prizePool = eventEl
        .find('.additional-info tr')
        .eq(0)
        .find('td')
        .eq(1)
        .text()
    }

    let eventName = eventEl.find(nameSelector).text()

    let typeName = eventEl
      .find('table tr')
      .eq(0)
      .find('td')
      .eq(3)
      .text() as EventType | undefined

    if (!typeName)
      typeName = eventName.toLowerCase().includes('major') ? EventType.Major : undefined

    return {
      id: Number((eventEl.attr('href') || '').split('/')[2]),
      name: eventName,
      dateStart: dateStart ? Number(dateStart) : undefined,
      dateEnd: dateEnd ? Number(dateEnd) : undefined,
      prizePool: prizePool,
      teams: teams.length ? Number(teams) : undefined,
      location: eventEl.find(locationSelector).prop('title'),
      type: typeName ? typeName : undefined
    }
  })

  return events
}
