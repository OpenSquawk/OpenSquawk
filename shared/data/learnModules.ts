import {ref} from "vue";

/** MODULES **/
export type Lesson = { id: string; title: string; desc: string; target: string; hints: string[]; keywords: string[] }
export type ModuleDef = { id: string; title: string; subtitle: string; art: string; lessons: Lesson[] }

const modules = ref<ModuleDef[]>([
    // NEW: ICAO Kapitel
    {
        id: 'icao',
        title: 'ICAO Alphabet',
        subtitle: 'Alphabets & Numbers',
        art: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'alpha',
                title: 'Alphabet A–M',
                desc: 'Alpha bis Mike sprechen.',
                target: 'Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike.',
                hints: ['konstant sprechen', 'deutlich trennen'],
                keywords: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike']
            },
            {
                id: 'alpha2',
                title: 'Alphabet N–Z',
                desc: 'November bis Zulu.',
                target: 'November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu.',
                hints: ['X-ray mit hyphen', 'Juliett mit zwei t'],
                keywords: ['November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu']
            },
            {
                id: 'numbers',
                title: 'Zahlen',
                desc: 'ICAO-Nummernlesen.',
                target: 'Tree Fower Fife Six Seven Eight Niner Zero.',
                hints: ['Nine → Niner', 'Three → Tree', 'Four → Fower', 'Five → Fife'],
                keywords: ['Tree', 'Fower', 'Fife', 'Niner']
            },
            {
                id: 'callsign-icao',
                title: 'Callsign Buchstabieren',
                desc: 'Beispiel-Callsign.',
                target: 'DLH one two three, Lufthansa one two three.',
                hints: ['DLH → Lufthansa', 'Nummern ICAO'],
                keywords: ['Lufthansa', 'DLH', 'one', 'two', 'three']
            }
        ]
    },
    {
        id: 'basics',
        title: 'Basics',
        subtitle: 'Callsign · Struktur · Zahlen',
        art: 'https://images.unsplash.com/photo-1541392822270-85b2ff6c4577?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'checkin',
                title: 'Check-in',
                desc: 'Erster Call korrekt.',
                target: 'Frankfurt Ground, Lufthansa one two three at stand A12, request taxi.',
                hints: ['Station • Callsign • Position • Intent'],
                keywords: ['Frankfurt Ground', 'Lufthansa', 'stand', 'request taxi']
            },
            {
                id: 'readback', title: 'Short Readback', desc: 'Kurz bestätigen.',
                target: 'Lufthansa one two three, roger.',
                hints: ['Callsign + roger/affirm'], keywords: ['roger', 'affirm']
            }
        ]
    },
    {
        id: 'ground',
        title: 'Ground',
        subtitle: 'Taxi • Hold Short • Handoff',
        art: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'taxi1', title: 'Taxi-Clearance', desc: 'Via A, A5, B2.',
                target: 'Lufthansa one two three, taxi to runway two five via A, A five, B two, hold short runway two five.',
                hints: ['Taxi to runway • via • hold short'], keywords: ['taxi to runway', 'via', 'hold short']
            },
            {
                id: 'handoff', title: 'Handoff', desc: 'Frequenzwechsel.',
                target: 'Contact Tower on one one niner decimal five, Lufthansa one two three.',
                hints: ['Contact Tower on … • decimal'], keywords: ['Contact Tower', 'decimal']
            }
        ]
    },
    {
        id: 'departure',
        title: 'Departure',
        subtitle: 'Line up • Takeoff',
        art: 'https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'lineup', title: 'Line up', desc: 'Aufrollen und warten.',
                target: 'Lufthansa one two three, line up and wait runway two five.',
                hints: ['line up and wait'], keywords: ['line up and wait']
            }
        ]
    },
    {
        id: 'arrival',
        title: 'Arrival',
        subtitle: 'Approach • Vacate',
        art: 'https://images.unsplash.com/photo-1542089363-07b2d92aacc3?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'vacate', title: 'Vacate', desc: 'Verlasse Bahn, melde frei.',
                target: 'Lufthansa one two three, vacated runway two five via A six.',
                hints: ['vacated runway • via taxiway'], keywords: ['vacated', 'runway']
            }
        ]
    },
    {
        id: 'vatsim',
        title: 'VATSIM',
        subtitle: 'Netiquette • Connect',
        art: 'https://images.unsplash.com/photo-1508264769638-658b34d79f6e?q=80&w=1600&auto=format&fit=crop',
        lessons: [
            {
                id: 'checkin', title: 'IFR Check-in', desc: 'Erster Online-Call.',
                target: 'Frankfurt Ground, Lufthansa one two three, A320 at stand A12, IFR to Munich, information Bravo, request clearance.',
                hints: ['IFR/VFR • ATIS Info • Request'], keywords: ['IFR', 'information', 'request clearance']
            }
        ]
    }
])

export default modules

