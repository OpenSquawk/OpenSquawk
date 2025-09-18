const atcDecisionTree = {
  "schema_version": "1.0",
  "name": "icao_atc_decision_tree",
  "description": "Machine-readable ICAO/FAA-style ATC flow for IFR, suited for LLM+Whisper+TTS loop.",
  "start_state": "CD_CHECK_ATIS",
  "end_states": ["FLOW_COMPLETE"],
  "variables": {
    "callsign": "DLH39A",
    "acf_type": "A320",
    "dep": "EDDF",
    "dest": "EDDM",
    "stand": "A12",
    "runway": "25R",
    "sid": "ANEKI 7S",
    "transition": "ANEKI",
    "squawk": "1234",
    "initial_altitude_ft": 5000,
    "climb_altitude_ft": 7000,
    "cruise_flight_level": "FL360",
    "star": "RNAV X",
    "approach_type": "ILS Z",
    "taxi_route": "V A",
    "missed_approach": "as published",
    "delivery_freq": "121.900",
    "ground_freq": "121.700",
    "tower_freq": "118.700",
    "departure_freq": "125.350",
    "approach_freq": "120.800",
    "handoff_freq": "121.800",
    "atis_freq": "118.025",
    "atis_code": "K",
    "gate": "B24",
    "trans_level": "FL070",
    "qnh_hpa": 1015,
    "push_delay_min": 5,
    "surface_wind": "220/05",
    "speed_restriction": "210 knots",
    "emergency_heading": "180",
    "remarks": "standard",
    "time_now": "ISO8601"
  },
  "flags": {
    "in_air": false,
    "emergency_active": false,
    "current_unit": "DEL",
    "stack": []
  },
  "policies": {
    "timeouts": {
      "pilot_readback_timeout_s": 8,
      "controller_ack_timeout_s": 6,
      "no_reply_retry_after_s": 5,
      "no_reply_max_retries": 2,
      "lost_comms_detect_after_s": 90
    },
    "no_reply_sequence": [
      {"after_s": 5, "controller_say_tpl": "{callsign}, confirm last transmission."},
      {"after_s": 10, "controller_say_tpl": "{callsign}, do you read?"},
      {"after_s": 20, "controller_say_tpl": "{callsign}, if you read, ident."}
    ],
    "interrupts_allowed_when": {
      "MAYDAY": "flags.in_air === true",
      "PANPAN": "flags.in_air === true",
      "TCAS_RA": "flags.in_air === true",
      "GO_AROUND": "true",
      "LOST_COMMS": "true",
      "UNABLE": "true",
      "STANDBY": "true"
    }
  },
  "hooks": {
    "on_state_enter": true,
    "on_state_exit": true,
    "on_timeout": true,
    "on_interrupt": true,
    "on_handoff": true,
    "on_readback_check": true,
    "on_pilot_speech": true,
    "router_note": "Given pilot utterance → detect intent → if valid in active flow, branch; else jump to flow start with matching intent."
  },
  "roles": ["pilot", "atc", "system"],
  "phases": ["Preflight","Clearance","PushStart","TaxiOut","Departure","Climb","Enroute","Descent","Approach","Landing","TaxiIn","Postflight","Interrupt","LostComms","Missed"],
  "states": {
    "PREFLIGHT_START": {
      "role": "pilot",
      "phase": "Preflight",
      "prompt_out": "Initial contact with Clearance Delivery.",
      "next": [{"to": "CD_CHECK_ATIS"}]
    },
    "CD_CHECK_ATIS": {
      "role": "pilot",
      "phase": "Clearance",
      "utterance_tpl": "{callsign} information {atis_code}, IFR to {dest}, stand {stand}, request clearance.",
      "next": [{"to": "CD_ISSUE_CLR"}],
      "on_timeout": [{"after_s": 5, "action": "remind", "say_tpl": "{callsign}, say request."}]
    },
    "CD_ISSUE_CLR": {
      "role": "atc",
      "phase": "Clearance",
      "say_tpl": "{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb {initial_altitude_ft} feet, squawk {squawk}.",
      "readback_required": ["dest","sid","runway","initial_altitude_ft","squawk"],
      "next": [
        {"to": "CD_VERIFY_READBACK"},
        {"to": "CD_AMEND_CLR", "when": "pilot_requests_amendment === true"}
      ]
    },
    "CD_VERIFY_READBACK": {
      "role": "pilot",
      "phase": "Clearance",
      "utterance_tpl": "{callsign} cleared {dest} via {sid}, runway {runway}, climb {initial_altitude_ft}, squawk {squawk}.",
      "next": [{"to": "CD_READBACK_CHECK"}]
    },
    "CD_READBACK_CHECK": {
      "role": "atc",
      "phase": "Clearance",
      "auto": "check_readback",
      "ok_next": [{"to": "CD_CLR_COMPLETE"}],
      "bad_next": [{"to": "CD_READBACK_CORRECT"}],
      "on_timeout": [{"after_s": 6, "action": "say", "say_tpl": "{callsign}, read back clearance."}]
    },
    "CD_READBACK_CORRECT": {
      "role": "atc",
      "phase": "Clearance",
      "say_tpl": "{callsign}, negative; expect {sid}, runway {runway}, climb {initial_altitude_ft}, squawk {squawk}.",
      "next": [{"to": "CD_VERIFY_READBACK"}]
    },
    "CD_AMEND_CLR": {
      "role": "atc",
      "phase": "Clearance",
      "say_tpl": "{callsign}, amended clearance: {sid} {transition} departure, runway {runway}.",
      "next": [{"to": "CD_VERIFY_READBACK"}]
    },
    "CD_CLR_COMPLETE": {
      "role": "atc",
      "phase": "Clearance",
      "say_tpl": "{callsign}, readback correct. Start-up at own discretion. Contact Ground {ground_freq} when ready for push and start.",
      "actions": [{"set": "flags.current_unit", "to": "DEL"}],
      "handoff": {"to": "GROUND","freq": "{ground_freq}"},
      "next": [{"to": "GRD_READY_FOR_PUSH"}]
    },

    "GRD_READY_FOR_PUSH": {
      "role": "pilot",
      "phase": "PushStart",
      "utterance_tpl": "{callsign} stand {stand}, ready for push and start.",
      "next": [
        {"to": "GRD_PUSH_APPROVE", "when": "push_available === true"},
        {"to": "GRD_PUSH_WAIT", "when": "push_available === false"}
      ]
    },
    "GRD_PUSH_WAIT": {
      "role": "atc",
      "phase": "PushStart",
      "say_tpl": "{callsign}, push and start approved in {push_delay_min} minutes. Expect taxi via {taxi_route}.",
      "timer_next": [{"after_s": 60, "to": "GRD_PUSH_APPROVE"}],
      "next": [{"to": "GRD_PUSH_APPROVE"}]
    },
    "GRD_PUSH_APPROVE": {
      "role": "atc",
      "phase": "PushStart",
      "say_tpl": "{callsign}, push and start approved, facing {runway}. QNH {qnh_hpa}.",
      "next": [{"to": "GRD_TAXI_REQUEST"}]
    },

    "GRD_TAXI_REQUEST": {
      "role": "pilot",
      "phase": "TaxiOut",
      "utterance_tpl": "{callsign}, request taxi.",
      "next": [{"to": "GRD_TAXI_INSTR"}]
    },
    "GRD_TAXI_INSTR": {
      "role": "atc",
      "phase": "TaxiOut",
      "say_tpl": "{callsign}, taxi to runway {runway} via {taxi_route}, hold short runway {runway}.",
      "readback_required": ["runway","taxi_route","hold_short"],
      "next": [{"to": "GRD_TAXI_READBACK"}]
    },
    "GRD_TAXI_READBACK": {
      "role": "pilot",
      "phase": "TaxiOut",
      "utterance_tpl": "{callsign} taxi to {runway} via {taxi_route}, holding short {runway}.",
      "next": [{"to": "TWR_CONTACT"}]
    },

    "TWR_CONTACT": {
      "role": "atc",
      "phase": "TaxiOut",
      "say_tpl": "{callsign}, contact Tower {tower_freq} when number one.",
      "handoff": {"to": "TOWER","freq": "{tower_freq}"},
      "next": [{"to": "TWR_LINEUP_REQ"}]
    },
    "TWR_LINEUP_REQ": {
      "role": "pilot",
      "phase": "Departure",
      "utterance_tpl": "{callsign} holding short {runway}, ready for departure.",
      "next": [
        {"to": "TWR_LINEUP", "when": "runway_occupied === true"},
        {"to": "TWR_TAKEOFF_CLR", "when": "runway_occupied === false"}
      ]
    },
    "TWR_LINEUP": {
      "role": "atc",
      "phase": "Departure",
      "say_tpl": "{callsign}, line up and wait runway {runway}.",
      "next": [{"to": "TWR_TAKEOFF_CLR"}]
    },
    "TWR_TAKEOFF_CLR": {
      "role": "atc",
      "phase": "Departure",
      "say_tpl": "{callsign}, wind {surface_wind}, runway {runway} cleared for take-off.",
      "readback_required": ["runway","cleared_takeoff"],
      "actions": [{"set": "flags.in_air", "to": true}],
      "next": [{"to": "TWR_TAKEOFF_READBACK"}]
    },
    "TWR_TAKEOFF_READBACK": {
      "role": "pilot",
      "phase": "Departure",
      "utterance_tpl": "{callsign} cleared for take-off {runway}.",
      "next": [{"to": "DEP_CONTACT"}]
    },

    "DEP_CONTACT": {
      "role": "atc",
      "phase": "Departure",
      "say_tpl": "{callsign}, contact Departure {departure_freq}.",
      "handoff": {"to": "DEPARTURE","freq": "{departure_freq}"},
      "actions": [{"set": "flags.current_unit", "to": "DEP"}],
      "next": [{"to": "DEP_IDENT"}]
    },
    "DEP_IDENT": {
      "role": "pilot",
      "phase": "Climb",
      "utterance_tpl": "{callsign} passing {initial_altitude_ft}, on SID {sid}.",
      "next": [{"to": "DEP_CLIMB_INSTR"}]
    },
    "DEP_CLIMB_INSTR": {
      "role": "atc",
      "phase": "Climb",
      "say_tpl": "{callsign}, climb {climb_altitude_ft} feet, proceed direct {transition} if able.",
      "next": [
        {"to": "DEP_CLIMB_READBACK", "when": "pilot_able === true"},
        {"to": "DEP_UNABLE_DIR", "when": "pilot_able === false"}
      ]
    },
    "DEP_UNABLE_DIR": {
      "role": "pilot",
      "phase": "Climb",
      "utterance_tpl": "{callsign} unable direct {transition}.",
      "next": [{"to": "DEP_ALT_RTE"}]
    },
    "DEP_ALT_RTE": {
      "role": "atc",
      "phase": "Climb",
      "say_tpl": "{callsign}, continue SID, report passing {climb_altitude_ft}.",
      "next": [{"to": "ENR_HANDOFF"}]
    },
    "DEP_CLIMB_READBACK": {
      "role": "pilot",
      "phase": "Climb",
      "utterance_tpl": "{callsign} climb {climb_altitude_ft}, direct {transition}.",
      "next": [{"to": "ENR_HANDOFF"}]
    },

    "ENR_HANDOFF": {
      "role": "atc",
      "phase": "Enroute",
      "say_tpl": "{callsign}, contact Center {handoff_freq}.",
      "handoff": {"to": "CENTER","freq": "{handoff_freq}"},
      "actions": [{"set": "flags.current_unit", "to": "CTR"}],
      "next": [{"to": "ENR_CRUISE"}]
    },
    "ENR_CRUISE": {
      "role": "pilot",
      "phase": "Enroute",
      "auto": "monitor",
      "next": [{"to": "DES_INITIATE"}]
    },

    "DES_INITIATE": {
      "role": "atc",
      "phase": "Descent",
      "say_tpl": "{callsign}, descend via {star} {transition}, QNH {qnh_hpa}.",
      "next": [{"to": "DES_READBACK"}]
    },
    "DES_READBACK": {
      "role": "pilot",
      "phase": "Descent",
      "utterance_tpl": "{callsign} descend via {star} {transition}, QNH {qnh_hpa}.",
      "next": [{"to": "APP_HANDOFF"}]
    },

    "APP_HANDOFF": {
      "role": "atc",
      "phase": "Descent",
      "say_tpl": "{callsign}, contact Approach {approach_freq}.",
      "handoff": {"to": "APPROACH","freq": "{approach_freq}"},
      "actions": [{"set": "flags.current_unit", "to": "APP"}],
      "next": [{"to": "APP_VECTORING"}]
    },
    "APP_VECTORING": {
      "role": "atc",
      "phase": "Approach",
      "say_tpl": "{callsign}, turn left heading 220, descend to {initial_altitude_ft} feet, reduce speed {speed_restriction}.",
      "next": [{"to": "APP_CLEARED_APP"}]
    },
    "APP_CLEARED_APP": {
      "role": "atc",
      "phase": "Approach",
      "say_tpl": "{callsign}, cleared {approach_type} approach runway {runway}, report established.",
      "next": [{"to": "APP_ESTABLISHED"}]
    },
    "APP_ESTABLISHED": {
      "role": "pilot",
      "phase": "Approach",
      "utterance_tpl": "{callsign} established localizer {runway}.",
      "next": [{"to": "TWR_LAND_CONTACT"}]
    },

    "TWR_LAND_CONTACT": {
      "role": "atc",
      "phase": "Approach",
      "say_tpl": "{callsign}, contact Tower {tower_freq}.",
      "handoff": {"to": "TOWER","freq": "{tower_freq}"},
      "actions": [{"set": "flags.current_unit", "to": "TWR"}],
      "next": [{"to": "TWR_LAND_CLEARABLE"}]
    },
    "TWR_LAND_CLEARABLE": {
      "role": "atc",
      "phase": "Landing",
      "condition": "runway_available === true",
      "say_tpl": "{callsign}, wind {surface_wind}, runway {runway} cleared to land.",
      "else_say_tpl": "{callsign}, continue approach, expect late landing clearance.",
      "next": [
        {"to": "TWR_LAND_READBACK", "when": "runway_available === true"},
        {"to": "TWR_CONTINUE_APPROACH", "when": "runway_available === false"}
      ]
    },
    "TWR_CONTINUE_APPROACH": {
      "role": "atc",
      "phase": "Landing",
      "say_tpl": "{callsign}, continue approach.",
      "next": [{"to": "TWR_LAND_CLEARABLE"}]
    },
    "TWR_LAND_READBACK": {
      "role": "pilot",
      "phase": "Landing",
      "utterance_tpl": "{callsign} cleared to land {runway}.",
      "next": [{"to": "TWR_VACATE"}]
    },
    "TWR_VACATE": {
      "role": "atc",
      "phase": "Landing",
      "say_tpl": "{callsign}, vacate via {taxi_route}, contact Ground {ground_freq}.",
      "actions": [{"set": "flags.in_air", "to": false}],
      "handoff": {"to": "GROUND","freq": "{ground_freq}"},
      "next": [{"to": "GRD_TAXI_IN_REQ"}]
    },

    "GRD_TAXI_IN_REQ": {
      "role": "pilot",
      "phase": "TaxiIn",
      "utterance_tpl": "{callsign} runway vacated, request taxi to stand.",
      "next": [{"to": "GRD_TAXI_INSTR_IN"}]
    },
    "GRD_TAXI_INSTR_IN": {
      "role": "atc",
      "phase": "TaxiIn",
      "say_tpl": "{callsign}, taxi to stand {gate} via {taxi_route}.",
      "readback_required": ["gate","taxi_route"],
      "next": [{"to": "GRD_TAXI_IN_READBACK"}]
    },
    "GRD_TAXI_IN_READBACK": {
      "role": "pilot",
      "phase": "TaxiIn",
      "utterance_tpl": "{callsign} taxi to stand {gate} via {taxi_route}.",
      "next": [{"to": "FLOW_COMPLETE"}]
    },
    "FLOW_COMPLETE": {
      "role": "system",
      "phase": "Postflight",
      "auto": "end",
      "next": []
    },

    /* ===== Interrupts (conditioned) ===== */

    "INT_MAYDAY": {
      "role": "pilot",
      "phase": "Interrupt",
      "guard": "flags.in_air === true",
      "utterance_tpl": "MAYDAY MAYDAY MAYDAY, {callsign}, {problem}, intentions {intent}.",
      "priority": "highest",
      "actions": [{"set": "flags.emergency_active", "to": true}],
      "next": [{"to": "ATC_MAYDAY_VECTOR"}]
    },
    "ATC_MAYDAY_VECTOR": {
      "role": "atc",
      "phase": "Interrupt",
      "say_tpl": "{callsign}, roger MAYDAY, fly heading {emergency_heading}, climb/descend {initial_altitude_ft}, cleared direct {dest} when able, QNH {qnh_hpa}.",
      "next": [{"to": "ATC_MAYDAY_COORD"}]
    },
    "ATC_MAYDAY_COORD": {
      "role": "system",
      "phase": "Interrupt",
      "actions": ["alert_emergency_services","notify_adjacent_units"],
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },

    "INT_PANPAN": {
      "role": "pilot",
      "phase": "Interrupt",
      "guard": "flags.in_air === true",
      "utterance_tpl": "PAN PAN PAN, {callsign}, {problem}, request priority.",
      "priority": "high",
      "actions": [{"set": "flags.emergency_active", "to": true}],
      "next": [{"to": "ATC_PAN_ACK"}]
    },
    "ATC_PAN_ACK": {
      "role": "atc",
      "phase": "Interrupt",
      "say_tpl": "{callsign}, PAN acknowledged, priority granted, expect vectors direct {dest} or nearest suitable.",
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },

    "INT_TCAS_RA": {
      "role": "pilot",
      "phase": "Interrupt",
      "guard": "flags.in_air === true",
      "utterance_tpl": "{callsign} TCAS RA, deviating.",
      "actions": ["suspend_clearances"],
      "next": [{"to": "ATC_TCAS_ACK"}]
    },
    "ATC_TCAS_ACK": {
      "role": "atc",
      "phase": "Interrupt",
      "say_tpl": "{callsign}, roger TCAS RA, report clear of conflict.",
      "next": [{"to": "ATC_TCAS_RESUME"}]
    },
    "ATC_TCAS_RESUME": {
      "role": "pilot",
      "phase": "Interrupt",
      "utterance_tpl": "{callsign} clear of conflict, returning to clearance.",
      "actions": [{"set": "flags.emergency_active", "to": false}],
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },

    "INT_GOA": {
      "role": "pilot",
      "phase": "Missed",
      "utterance_tpl": "{callsign} going around, {missed_approach}.",
      "actions": [{"set": "flags.in_air", "to": true}],
      "next": [{"to": "ATC_GOA_INSTR"}]
    },
    "ATC_GOA_INSTR": {
      "role": "atc",
      "phase": "Missed",
      "say_tpl": "{callsign}, roger go-around, fly published missed approach, climb {initial_altitude_ft}, contact Approach {approach_freq}.",
      "handoff": {"to": "APPROACH","freq": "{approach_freq}"},
      "next": [{"to": "APP_VECTORING"}]
    },

    "INT_NORDO": {
      "role": "system",
      "phase": "LostComms",
      "trigger": "no_reply > policies.timeouts.lost_comms_detect_after_s",
      "actions": ["lost_comms_procedure"],
      "next": [{"to": "ATC_NORDO_ACTION"}]
    },
    "ATC_NORDO_ACTION": {
      "role": "atc",
      "phase": "LostComms",
      "say_tpl": "(Transmitted blind) {callsign}, if you read, squawk IDENT and continue per last clearance. Expect vectors.",
      "next": [{"to": "SYSTEM_NORDO_COORD"}]
    },
    "SYSTEM_NORDO_COORD": {
      "role": "system",
      "phase": "LostComms",
      "actions": ["notify_adjacent_units","monitor_light_gun","publish_ATIS_note"],
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },

    "INT_UNABLE": {
      "role": "pilot",
      "phase": "Interrupt",
      "utterance_tpl": "{callsign} unable {instruction}.",
      "next": [{"to": "ATC_ALT_PROPOSAL"}]
    },
    "ATC_ALT_PROPOSAL": {
      "role": "atc",
      "phase": "Interrupt",
      "say_tpl": "{callsign}, alternative: {alt_instruction}.",
      "next": [
        {"to": "PILOT_ACCEPT_ALT"},
        {"to": "PILOT_REJECT_ALT"}
      ]
    },
    "PILOT_ACCEPT_ALT": {
      "role": "pilot",
      "phase": "Interrupt",
      "utterance_tpl": "{callsign} wilco.",
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },
    "PILOT_REJECT_ALT": {
      "role": "pilot",
      "phase": "Interrupt",
      "utterance_tpl": "{callsign} negative, request {intent}.",
      "next": [{"to": "ATC_ALT_PROPOSAL"}]
    },

    "INT_STANDBY": {
      "role": "pilot",
      "phase": "Interrupt",
      "utterance_tpl": "{callsign} standby.",
      "actions": ["pause_exchange"],
      "next": [{"to": "RESUME_PRIOR_FLOW"}]
    },

    /* ===== Generic glue & router ===== */

    "RESUME_PRIOR_FLOW": {
      "role": "system",
      "phase": "Interrupt",
      "auto": "pop_stack_or_route_by_intent",
      "actions": [
        {"if": "flags.emergency_active === true && flags.in_air === true", "set": "flags.emergency_active", "to": false}
      ],
      "next": []
    },

    "GEN_NO_REPLY": {
      "role": "system",
      "phase": "Interrupt",
      "trigger": "no_reply",
      "policy_ref": "policies.no_reply_sequence",
      "escalate_to": "INT_NORDO",
      "next": []
    }
  }
}


export default atcDecisionTree;
