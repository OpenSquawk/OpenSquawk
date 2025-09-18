import type { AirportFrequency } from '~/shared/types/airport'

export const fallbackAirportFrequencies: Record<string, AirportFrequency[]> = {
  EDDF: [
    { type: 'ATIS', frequency: '118.020', name: 'Frankfurt ATIS', description: 'Automatic terminal information service' },
    { type: 'DEL', frequency: '121.900', name: 'Clearance Delivery' },
    { type: 'GND', frequency: '121.700', name: 'Ground' },
    { type: 'TWR', frequency: '118.700', name: 'Tower' },
    { type: 'DEP', frequency: '125.350', name: 'Departure' },
    { type: 'APP', frequency: '120.800', name: 'Approach' },
    { type: 'CTR', frequency: '121.800', name: 'Langen Radar' }
  ],
  EDDM: [
    { type: 'ATIS', frequency: '118.030', name: 'Munich ATIS', description: 'Automatic terminal information service' },
    { type: 'DEL', frequency: '121.655', name: 'Clearance Delivery' },
    { type: 'GND', frequency: '121.805', name: 'Ground' },
    { type: 'TWR', frequency: '118.700', name: 'Tower' },
    { type: 'DEP', frequency: '120.300', name: 'Departure' },
    { type: 'APP', frequency: '119.200', name: 'Approach' },
    { type: 'CTR', frequency: '133.150', name: 'Munich Radar' }
  ]
}
