import type { DecisionLesson, DecisionScenario, FlightStrip } from '~~/shared/learn/decision-types'
import type { ModuleDef } from '~~/shared/learn/types'

function gradientArt(colors: string[]): string {
  const stops = colors
    .map((color, idx) => `<stop offset="${Math.round((idx / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${color}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect fill="url(#g)" width="400" height="240"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample<T>(values: readonly T[]): T {
  return values[randInt(0, values.length - 1)]
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

const airlines = ['DLH', 'BAW', 'AFR', 'KLM', 'SWR', 'EZY', 'RYR', 'AUA', 'SAS', 'UAE']
const aircraftTypes = ['A320', 'A321', 'B738', 'B77W', 'A359', 'C172', 'E190', 'A20N']

function makeCallsign(): string {
  return `${sample(airlines)}${randInt(101, 999)}`
}

function categoryForType(type: string): 'heavy' | 'medium' | 'light' {
  if (['B77W', 'A359', 'B744', 'A388'].includes(type)) return 'heavy'
  if (['C172', 'DA42', 'SR22'].includes(type)) return 'light'
  return 'medium'
}

function makeStrip(partial: Partial<FlightStrip> = {}): FlightStrip {
  const type = partial.type ?? sample(aircraftTypes)
  const category = partial.category ?? categoryForType(type)
  return {
    callsign: partial.callsign ?? makeCallsign(),
    type,
    altitude: partial.altitude ?? `FL${randInt(70, 260)}`,
    heading: partial.heading ?? `${randInt(0, 35) * 10}`.padStart(3, '0'),
    position: partial.position ?? sample(['12nm final', 'downwind', 'base leg', 'holding', 'taxiway A', 'departure hold']),
    intention: partial.intention ?? sample(['arrival', 'departure', 'crossing', 'pushback']),
    category,
    status: partial.status ?? 'normal'
  }
}

function cloneScenario(scenario: DecisionScenario): DecisionScenario {
  return JSON.parse(JSON.stringify(scenario)) as DecisionScenario
}

function scenario(briefing: string, strips: FlightStrip[], steps: DecisionScenario['steps']): DecisionScenario {
  return cloneScenario({ briefing, strips, steps })
}

const controllerWorkflowLessons: DecisionLesson[] = [
  {
    id: 'controller-departure-sequencing',
    title: 'Departure Sequencing',
    desc: 'Sequence departures while respecting wake turbulence and SID conflicts.',
    keywords: ['Departure', 'Wake', 'Sequencing'],
    hints: [
      'Launch lighter traffic first when routes diverge to avoid wake delays.',
      'Keep same-SID departures separated unless you can guarantee divergence.'
    ],
    generate: () => {
      const heavy = makeStrip({ type: 'B77W', category: 'heavy', intention: 'departure', position: 'holding point A1' })
      const medium = makeStrip({ type: 'A320', category: 'medium', intention: 'departure', position: 'holding point A1' })
      const light = makeStrip({ type: 'C172', category: 'light', intention: 'departure', position: 'holding point A1' })
      const order = [light.callsign, medium.callsign, heavy.callsign]
      return scenario(
        'You are Tower. Three departures are ready at the same holding point. Sequence them for safe, efficient flow.',
        [heavy, medium, light],
        [
          {
            prompt: 'Set the departure order (first to last).',
            type: 'sequencing',
            items: shuffle(order),
            correct: order,
            explanation: 'Light first, then medium, then heavy keeps wake impact low while maintaining flow.'
          }
        ]
      )
    }
  },
  {
    id: 'controller-arrival-spacing',
    title: 'Arrival Spacing',
    desc: 'Build a stable arrival sequence and assign base headings.',
    keywords: ['Arrival', 'Spacing', 'Approach'],
    hints: [
      'Order by distance and closing speed, not just altitude.',
      'Use heading assignments to create stable spacing before final.'
    ],
    generate: () => {
      const inboundA = makeStrip({ type: 'A320', intention: 'arrival', position: '18nm north', heading: '190' })
      const inboundB = makeStrip({ type: 'B738', intention: 'arrival', position: '14nm east', heading: '260' })
      const inboundC = makeStrip({ type: 'E190', intention: 'arrival', position: '22nm west', heading: '090' })
      const inboundD = makeStrip({ type: 'A359', category: 'heavy', intention: 'arrival', position: '10nm south', heading: '360' })
      const landingOrder = [inboundD.callsign, inboundB.callsign, inboundA.callsign, inboundC.callsign]
      return scenario(
        'You are Approach with four arrivals converging toward runway 26. Build spacing and assign downwind vectors.',
        [inboundA, inboundB, inboundC, inboundD],
        [
          {
            prompt: 'Choose the safest landing sequence.',
            type: 'sequencing',
            items: shuffle(landingOrder),
            correct: landingOrder,
            explanation: 'Closest aircraft lands first, then medium traffic, while the most distant is delayed on vector.'
          },
          {
            prompt: 'Assign initial vectors for each callsign (same order as list).',
            type: 'assignment',
            items: landingOrder,
            options: ['180', '210', '240', '270'],
            correct: ['180', '210', '240', '270'],
            explanation: 'Staggered base headings preserve spacing into final approach.'
          }
        ]
      )
    }
  },
  {
    id: 'controller-wake-separation',
    title: 'Wake Turbulence Separation',
    desc: 'Pick the correct wake turbulence timing constraints.',
    keywords: ['Wake', 'Separation', 'Timing'],
    hints: [
      'Heavy to light combinations need the largest time spacing.',
      'When in doubt, protect the lighter aircraft.'
    ],
    generate: () => scenario(
      'Heavy traffic is leading on the ILS. You must apply standard wake separation behind it.',
      [
        makeStrip({ callsign: makeCallsign(), type: 'B77W', category: 'heavy', intention: 'arrival', position: '5nm final', heading: '262' }),
        makeStrip({ callsign: makeCallsign(), type: 'A320', category: 'medium', intention: 'arrival', position: '8nm final', heading: '262' }),
        makeStrip({ callsign: makeCallsign(), type: 'C172', category: 'light', intention: 'arrival', position: '11nm final', heading: '262' })
      ],
      [
        {
          prompt: 'Which wake turbulence spacing set is correct?',
          type: 'choice',
          options: [
            'Heavy->Medium 2 min, Heavy->Light 3 min, Medium->Light 3 min',
            'Heavy->Medium 1 min, Heavy->Light 2 min, Medium->Light 2 min',
            'Heavy->Medium 3 min, Heavy->Light 4 min, Medium->Light 2 min'
          ],
          correct: 'Heavy->Medium 2 min, Heavy->Light 3 min, Medium->Light 3 min',
          explanation: 'This option protects medium and light aircraft from heavy wake in line with standard practice.'
        }
      ]
    )
  },
  {
    id: 'controller-runway-conflict',
    title: 'Runway Conflict',
    desc: 'Resolve competing runway requests without compromising safety.',
    keywords: ['Runway', 'Conflict', 'Tower'],
    hints: [
      'Arrivals inside 4nm final strongly limit runway occupancy options.',
      'Crossings must wait when runway availability is uncertain.'
    ],
    generate: () => scenario(
      'You have one aircraft on 3nm final, one departure lined up, and one aircraft requesting runway crossing.',
      [
        makeStrip({ intention: 'arrival', position: '3nm final', heading: '265' }),
        makeStrip({ intention: 'departure', position: 'line up and wait', heading: '265' }),
        makeStrip({ intention: 'crossing', position: 'holding short runway', heading: '---', altitude: 'GND' })
      ],
      [
        {
          prompt: 'What is the safest immediate instruction?',
          type: 'choice',
          options: [
            'Hold the crosser, clear the arrival to land, keep departure holding',
            'Clear departure immediately and cross runway traffic behind it',
            'Send arrival around and clear crossing traffic now'
          ],
          correct: 'Hold the crosser, clear the arrival to land, keep departure holding',
          explanation: 'Protecting the arriving aircraft and keeping crossings stopped removes runway conflict risk.'
        }
      ]
    )
  },
  {
    id: 'controller-frequency-priority',
    title: 'Frequency Priority',
    desc: 'Prioritize transmissions during heavy frequency load.',
    keywords: ['Priority', 'Workload', 'Emergency'],
    hints: [
      'Emergency traffic is always first.',
      'Aircraft in airborne critical phases outrank ground requests.'
    ],
    generate: () => {
      const emergency = makeStrip({ status: 'emergency', intention: 'arrival', position: '8nm final', type: 'A320' })
      const arrivals = [
        makeStrip({ intention: 'arrival', position: '12nm final', type: 'B738' }),
        makeStrip({ intention: 'arrival', position: 'downwind', type: 'E190' })
      ]
      const departures = [
        makeStrip({ intention: 'departure', position: 'holding point', type: 'A321' }),
        makeStrip({ intention: 'departure', position: 'taxiway A', type: 'B738' })
      ]
      const ground = [
        makeStrip({ intention: 'pushback', position: 'stand C12', altitude: 'GND', heading: '---' }),
        makeStrip({ intention: 'pushback', position: 'stand D8', altitude: 'GND', heading: '---' }),
        makeStrip({ intention: 'crossing', position: 'taxiway K', altitude: 'GND', heading: '---' })
      ]
      const strips = [emergency, ...arrivals, ...departures, ...ground]
      const order = [
        emergency.callsign,
        arrivals[0].callsign,
        arrivals[1].callsign,
        departures[0].callsign,
        departures[1].callsign,
        ground[0].callsign,
        ground[1].callsign,
        ground[2].callsign
      ]
      return scenario(
        'Eight aircraft are calling at once. Rank who should receive ATC attention first.',
        strips,
        [
          {
            prompt: 'Rank callsigns by transmission priority (highest to lowest).',
            type: 'priority',
            items: shuffle(order),
            correct: order,
            explanation: 'Emergency first, then airborne traffic in approach phase, then departures, then lower urgency ground traffic.'
          }
        ]
      )
    }
  },
  {
    id: 'controller-weather-deviation',
    title: 'Weather Deviation Decision',
    desc: 'Balance weather avoidance requests against conflicting traffic.',
    keywords: ['Weather', 'Deviation', 'Conflict'],
    hints: [
      'Approve deviations only when separation remains protected.',
      'If conflict exists, offer an alternative heading with clear reason.'
    ],
    generate: () => scenario(
      'An arrival requests 20nm left deviation for weather, but opposite-direction traffic is on that route.',
      [
        makeStrip({ intention: 'arrival', position: '25nm final', heading: '270', type: 'A321' }),
        makeStrip({ intention: 'arrival', position: 'opposite direction 18nm', heading: '090', type: 'B738' }),
        makeStrip({ intention: 'arrival', position: 'downwind', heading: '180', type: 'E190' })
      ],
      [
        {
          prompt: 'Pick the best response.',
          type: 'choice',
          options: [
            'Deny full left deviation, issue a smaller right deviation with vectors',
            'Approve full 20nm left immediately without restrictions',
            'Ignore the request and maintain present heading'
          ],
          correct: 'Deny full left deviation, issue a smaller right deviation with vectors',
          explanation: 'You acknowledge weather needs while preserving separation by offering a safe alternative.'
        }
      ]
    )
  }
]

const thinkLikeAtcLessons: DecisionLesson[] = [
  {
    id: 'atc-departure-puzzle',
    title: 'Departure Puzzle',
    desc: 'Decide the most efficient departure order from wake and route constraints.',
    keywords: ['Departure', 'Puzzle', 'Wake'],
    hints: [
      'Diverging routes can reduce wake-impact delays.',
      'Use the runway timeline, not just aircraft size.'
    ],
    generate: () => {
      const heavyNorth = makeStrip({ type: 'B77W', category: 'heavy', intention: 'departure', position: 'holding A1', heading: '360' })
      const lightSouth = makeStrip({ type: 'C172', category: 'light', intention: 'departure', position: 'holding A1', heading: '180' })
      const order = [lightSouth.callsign, heavyNorth.callsign]
      return scenario(
        'Two departures wait on the same runway. One heavy departs north, one light departs south.',
        [heavyNorth, lightSouth],
        [
          {
            prompt: 'Set departure order.',
            type: 'sequencing',
            items: shuffle(order),
            correct: order,
            explanation: 'Launching the light aircraft first can avoid a long wake delay because routes diverge quickly.'
          },
          {
            prompt: 'Pick the best controller reasoning.',
            type: 'choice',
            options: [
              'Light first due diverging tracks, then heavy',
              'Heavy always first regardless of route',
              'Delay both until a full stop runway check'
            ],
            correct: 'Light first due diverging tracks, then heavy',
            explanation: 'You still maintain safety while improving flow using route geometry.'
          }
        ]
      )
    }
  },
  {
    id: 'atc-conflict-detection',
    title: 'Conflict Detection',
    desc: 'Resolve a converging conflict with an immediate vector decision.',
    keywords: ['Conflict', 'Vectoring', 'Separation'],
    hints: [
      'Intervene early before closure rates spike.',
      'Turn the aircraft with lower downstream impact when possible.'
    ],
    generate: () => {
      const a = makeStrip({ type: 'A320', intention: 'arrival', position: '20nm west', heading: '090', altitude: 'FL110' })
      const b = makeStrip({ type: 'B738', intention: 'arrival', position: '18nm south', heading: '360', altitude: 'FL110' })
      return scenario(
        'Two arrivals are converging at the same altitude with high closure rate.',
        [a, b],
        [
          {
            prompt: 'Which aircraft gets the avoidance turn?',
            type: 'choice',
            options: [a.callsign, b.callsign],
            correct: b.callsign,
            explanation: 'Turning the southbound aircraft creates cleaner spacing with less impact on final sequencing.'
          },
          {
            prompt: `Assign a safe heading to ${b.callsign}.`,
            type: 'assignment',
            items: [b.callsign],
            options: ['030', '060', '120'],
            correct: ['060'],
            explanation: 'A moderate heading change resolves the crossing conflict without overcorrecting.'
          }
        ]
      )
    }
  },
  {
    id: 'atc-go-around-call',
    title: 'Go-Around Decision',
    desc: 'Decide if a go-around is required and issue a stabilizing instruction.',
    keywords: ['Go-Around', 'Tower', 'Final'],
    hints: [
      'When runway occupancy is uncertain, choose the safer option early.',
      'A go-around instruction must include heading/altitude if needed.'
    ],
    generate: () => {
      const finalAircraft = makeStrip({ type: 'A320', intention: 'arrival', position: '2nm final', heading: '265', altitude: '2500' })
      const runwayTraffic = makeStrip({ type: 'E190', intention: 'arrival', position: 'vacating runway', heading: '---', altitude: 'GND' })
      return scenario(
        'Final traffic is 2nm out and the runway is not confirmed clear yet.',
        [finalAircraft, runwayTraffic],
        [
          {
            prompt: 'Choose the immediate action.',
            type: 'choice',
            options: [
              'Issue go-around now',
              'Wait 10 more seconds and continue approach',
              'Clear to land and monitor'
            ],
            correct: 'Issue go-around now',
            explanation: 'At 2nm final with uncertain occupancy, a proactive go-around is safest.'
          },
          {
            prompt: `Assign follow-up vector for ${finalAircraft.callsign}.`,
            type: 'assignment',
            items: [finalAircraft.callsign],
            options: ['Runway heading climb 3000', 'Left heading 180 climb 4000', 'Right heading 090 maintain 2000'],
            correct: ['Runway heading climb 3000'],
            explanation: 'Runway heading and climb is a stable, predictable miss approach response.'
          }
        ]
      )
    }
  },
  {
    id: 'atc-emergency-reshuffle',
    title: 'Emergency Reshuffling',
    desc: 'Rebuild an approach sequence when one flight declares MAYDAY.',
    keywords: ['Emergency', 'Priority', 'Approach'],
    hints: [
      'Emergency traffic jumps to the top priority immediately.',
      'Re-sequence everyone else with minimal disruption.'
    ],
    generate: () => {
      const normal1 = makeStrip({ intention: 'arrival', position: '9nm final', heading: '262' })
      const normal2 = makeStrip({ intention: 'arrival', position: '13nm final', heading: '262' })
      const emergency = makeStrip({ intention: 'arrival', position: '15nm final', heading: '262', status: 'emergency', type: 'A321' })
      const normal3 = makeStrip({ intention: 'arrival', position: '18nm final', heading: '262' })
      const newOrder = [emergency.callsign, normal1.callsign, normal2.callsign, normal3.callsign]
      return scenario(
        'Four arrivals are sequenced. The third aircraft declares MAYDAY with smoke in cockpit.',
        [normal1, normal2, emergency, normal3],
        [
          {
            prompt: 'Re-rank arrival priority.',
            type: 'priority',
            items: shuffle(newOrder),
            correct: newOrder,
            explanation: 'Emergency traffic gets immediate priority; the rest keep relative order where possible.'
          },
          {
            prompt: 'Pick the best instruction for non-emergency traffic.',
            type: 'choice',
            options: [
              'Vector others away and extend downwind for spacing',
              'Keep all aircraft on present heading',
              'Clear all to land in current order'
            ],
            correct: 'Vector others away and extend downwind for spacing',
            explanation: 'Protect the emergency path while maintaining separation with managed delays.'
          }
        ]
      )
    }
  },
  {
    id: 'atc-taxi-conflict',
    title: 'Taxi Conflict Management',
    desc: 'Resolve a ground intersection conflict with hold and reroute decisions.',
    keywords: ['Ground', 'Taxi', 'Conflict'],
    hints: [
      'Prevent nose-to-nose conflicts before they happen.',
      'Use one hold and one reroute instead of stopping everyone.'
    ],
    generate: () => {
      const a = makeStrip({ intention: 'taxi', position: 'taxiway B approaching K', altitude: 'GND', heading: '---' })
      const b = makeStrip({ intention: 'taxi', position: 'taxiway K approaching B', altitude: 'GND', heading: '---' })
      const c = makeStrip({ intention: 'taxi', position: 'taxiway C inbound to K', altitude: 'GND', heading: '---' })
      return scenario(
        'Three taxiing aircraft converge on one intersection with no room for simultaneous movement.',
        [a, b, c],
        [
          {
            prompt: 'Who should hold position first?',
            type: 'choice',
            options: [a.callsign, b.callsign, c.callsign],
            correct: c.callsign,
            explanation: 'Holding the latest-arriving aircraft avoids deadlock and keeps two flows moving.'
          },
          {
            prompt: 'Rank next movement order once hold is issued.',
            type: 'sequencing',
            items: shuffle([a.callsign, b.callsign, c.callsign]),
            correct: [a.callsign, b.callsign, c.callsign],
            explanation: 'Clear one path first, then cross-conflict traffic, then release the held aircraft.'
          }
        ]
      )
    }
  },
  {
    id: 'atc-handoff-timing',
    title: 'Handoff Timing',
    desc: 'Choose the best sector handoff timing under downstream congestion.',
    keywords: ['Handoff', 'Coordination', 'Sector'],
    hints: [
      'Standard handoff points are baseline; coordination can adjust timing.',
      'Do not transfer workload blindly into an overloaded sector.'
    ],
    generate: () => scenario(
      'A climbing departure nears the sector boundary while the next sector reports high workload.',
      [
        makeStrip({ intention: 'departure', position: '2nm from boundary', heading: '325', altitude: 'FL145' }),
        makeStrip({ intention: 'arrival', position: 'holding south stack', heading: '090', altitude: 'FL170' })
      ],
      [
        {
          prompt: 'Best handoff strategy?',
          type: 'choice',
          options: [
            'Coordinate and handoff at boundary with update',
            'Handoff immediately to offload your frequency',
            'Keep aircraft indefinitely in your sector'
          ],
          correct: 'Coordinate and handoff at boundary with update',
          explanation: 'Boundary handoff with coordination balances standards and downstream workload.'
        }
      ]
    )
  }
]

const reverseSimLessons: DecisionLesson[] = [
  {
    id: 'reverse-busy-ground',
    title: 'Reverse Sim: Busy Ground',
    desc: 'Run a full ground sequence with pushback, taxi and inbound conflicts.',
    keywords: ['Reverse Sim', 'Ground', 'Multi-Step'],
    hints: [
      'Keep the movement map in your head and resolve one bottleneck at a time.',
      'Issue simple instructions that keep options open for the next step.'
    ],
    generate: () => {
      const pushA = makeStrip({ intention: 'pushback', position: 'stand A12', altitude: 'GND', heading: '---' })
      const pushB = makeStrip({ intention: 'pushback', position: 'stand B18', altitude: 'GND', heading: '---' })
      const taxiOut = makeStrip({ intention: 'taxi', position: 'taxiway N toward runway 26', altitude: 'GND', heading: '---' })
      const landed = makeStrip({ intention: 'arrival', position: 'vacated runway via K', altitude: 'GND', heading: '---' })
      return scenario(
        'You are Ground with two pushback requests, one taxi-out, and one arrival taxi-in request.',
        [pushA, pushB, taxiOut, landed],
        [
          {
            prompt: 'Choose pushback order.',
            type: 'sequencing',
            items: shuffle([pushA.callsign, pushB.callsign]),
            correct: [pushA.callsign, pushB.callsign],
            explanation: 'Releasing A12 first avoids blocking the taxi lane needed by the inbound arrival.'
          },
          {
            prompt: 'Who gets taxi priority through the choke point?',
            type: 'choice',
            options: [landed.callsign, taxiOut.callsign],
            correct: landed.callsign,
            explanation: 'Inbound traffic already on movement area should clear faster to reduce gridlock.'
          },
          {
            prompt: 'Set final movement order for all four flights.',
            type: 'priority',
            items: shuffle([landed.callsign, taxiOut.callsign, pushA.callsign, pushB.callsign]),
            correct: [landed.callsign, taxiOut.callsign, pushA.callsign, pushB.callsign],
            explanation: 'Clear the runway-adjacent movement first, then feed departures in controlled order.'
          }
        ]
      )
    }
  },
  {
    id: 'reverse-tower-rush-hour',
    title: 'Reverse Sim: Tower Rush Hour',
    desc: 'Handle mixed arrival/departure pressure with potential go-around.',
    keywords: ['Reverse Sim', 'Tower', 'Rush Hour'],
    hints: [
      'Protect the runway timeline first; everything else follows.',
      'Keep missed-approach contingencies ready before issuing clearances.'
    ],
    generate: () => {
      const dep1 = makeStrip({ intention: 'departure', position: 'line-up runway 26', altitude: 'GND', heading: '262' })
      const dep2 = makeStrip({ intention: 'departure', position: 'holding A2', altitude: 'GND', heading: '262' })
      const dep3 = makeStrip({ intention: 'departure', position: 'holding A3', altitude: 'GND', heading: '262' })
      const arr1 = makeStrip({ intention: 'arrival', position: '4nm final', heading: '262', altitude: '1900' })
      const arr2 = makeStrip({ intention: 'arrival', position: '8nm final', heading: '262', altitude: '2500' })
      return scenario(
        'Tower is saturated: three departures waiting and two arrivals inbound.',
        [dep1, dep2, dep3, arr1, arr2],
        [
          {
            prompt: 'Who gets immediate runway use?',
            type: 'choice',
            options: [arr1.callsign, dep1.callsign],
            correct: arr1.callsign,
            explanation: 'An aircraft at 4nm final is in the critical phase and must be protected first.'
          },
          {
            prompt: 'Sequence departures after first arrival lands.',
            type: 'sequencing',
            items: shuffle([dep1.callsign, dep2.callsign, dep3.callsign]),
            correct: [dep1.callsign, dep2.callsign, dep3.callsign],
            explanation: 'Use the runway-ready aircraft first, then release queued traffic progressively.'
          },
          {
            prompt: `If runway not vacated for ${arr2.callsign}, choose action.`,
            type: 'choice',
            options: ['Issue go-around with runway heading climb', 'Continue approach and hope runway clears', 'Stop all departures only'],
            correct: 'Issue go-around with runway heading climb',
            explanation: 'Uncertain runway occupancy near short final requires immediate go-around.'
          }
        ]
      )
    }
  },
  {
    id: 'reverse-approach-sequencing',
    title: 'Reverse Sim: Approach Sequencing',
    desc: 'Vector five arrivals from different quadrants into a stable stream.',
    keywords: ['Reverse Sim', 'Approach', 'Sequencing'],
    hints: [
      'Convert geometry into order: distance, speed, wake and turn potential.',
      'Use heading buckets to build predictable spacing.'
    ],
    generate: () => {
      const a = makeStrip({ intention: 'arrival', position: 'north 26nm', heading: '180', altitude: 'FL120', type: 'A320' })
      const b = makeStrip({ intention: 'arrival', position: 'east 21nm', heading: '270', altitude: 'FL130', type: 'B77W', category: 'heavy' })
      const c = makeStrip({ intention: 'arrival', position: 'south 18nm', heading: '360', altitude: 'FL110', type: 'B738' })
      const d = makeStrip({ intention: 'arrival', position: 'west 24nm', heading: '090', altitude: 'FL140', type: 'E190' })
      const e = makeStrip({ intention: 'arrival', position: 'northwest 16nm', heading: '140', altitude: 'FL100', type: 'A20N' })
      const landingOrder = [e.callsign, c.callsign, a.callsign, d.callsign, b.callsign]
      return scenario(
        'Five arrivals are inbound from all directions. Build a safe, efficient stream to final.',
        [a, b, c, d, e],
        [
          {
            prompt: 'Set landing order.',
            type: 'sequencing',
            items: shuffle(landingOrder),
            correct: landingOrder,
            explanation: 'Prioritize nearest/stable aircraft first while delaying heavy traffic for spacing.'
          },
          {
            prompt: 'Assign downwind headings in that order.',
            type: 'assignment',
            items: landingOrder,
            options: ['180', '200', '220', '240', '260'],
            correct: ['180', '200', '220', '240', '260'],
            explanation: 'Progressive headings create a stable arrival fan before base turns.'
          }
        ]
      )
    }
  },
  {
    id: 'reverse-emergency-inbound',
    title: 'Reverse Sim: Emergency Inbound',
    desc: 'Rebuild normal flow when an inbound MAYDAY aircraft appears.',
    keywords: ['Reverse Sim', 'Emergency', 'Priority'],
    hints: [
      'State intent clearly: who is number one, and what happens to everyone else.',
      'Avoid over-managing; simple vectors and holds are safest under pressure.'
    ],
    generate: () => {
      const mayday = makeStrip({ status: 'emergency', intention: 'arrival', position: '14nm final', heading: '260', type: 'A320' })
      const normal1 = makeStrip({ intention: 'arrival', position: '9nm final', heading: '260', type: 'B738' })
      const normal2 = makeStrip({ intention: 'arrival', position: '17nm final', heading: '260', type: 'E190' })
      const dep = makeStrip({ intention: 'departure', position: 'line-up runway', heading: '260', altitude: 'GND' })
      return scenario(
        'Normal approach flow is interrupted by a MAYDAY inbound with smoke indication.',
        [mayday, normal1, normal2, dep],
        [
          {
            prompt: 'Rank immediate priority.',
            type: 'priority',
            items: shuffle([mayday.callsign, normal1.callsign, normal2.callsign, dep.callsign]),
            correct: [mayday.callsign, normal1.callsign, normal2.callsign, dep.callsign],
            explanation: 'Emergency inbound first; keep departures low priority until sequence stabilizes.'
          },
          {
            prompt: 'Best command for non-emergency arrivals?',
            type: 'choice',
            options: [
              'Extend downwind and expect delay vectors',
              'Continue both arrivals unchanged',
              'Clear both to land after emergency'
            ],
            correct: 'Extend downwind and expect delay vectors',
            explanation: 'Controlled delay vectors preserve spacing and keep the emergency path clean.'
          },
          {
            prompt: 'Choose departure handling.',
            type: 'choice',
            options: ['Hold departure in position', 'Immediate takeoff before emergency', 'Taxi departure onto runway and wait'],
            correct: 'Hold departure in position',
            explanation: 'Stop runway complexity while emergency handling is underway.'
          }
        ]
      )
    }
  }
]

export const atcPerspectiveModules: ModuleDef[] = [
  {
    id: 'controller-workflow',
    title: 'Controller Workflow',
    subtitle: 'Sequence, separate and prioritize like tower/approach',
    art: gradientArt(['#004d40', '#00695c', '#00796b']),
    lessons: controllerWorkflowLessons,
    meta: { exerciseType: 'decision' }
  },
  {
    id: 'think-like-atc',
    title: 'Think Like ATC',
    subtitle: 'Conflict solving and tactical controller decisions',
    art: gradientArt(['#1b5e20', '#2e7d32', '#388e3c']),
    lessons: thinkLikeAtcLessons,
    meta: { exerciseType: 'decision' }
  },
  {
    id: 'reverse-sim',
    title: 'Reverse Sim',
    subtitle: 'Multi-step ATC scenarios under pressure',
    art: gradientArt(['#0d47a1', '#1565c0', '#1976d2']),
    lessons: reverseSimLessons,
    meta: { exerciseType: 'decision' }
  }
]

export { controllerWorkflowLessons, thinkLikeAtcLessons, reverseSimLessons }
