# MSFS Bridge API Examples

All bridge endpoints authenticate bridge clients via the `x-bridge-token` header.

## 1. Read Bridge status

```bash
curl -X GET 'https://opensquawk.de/api/bridge/me' \
  -H 'x-bridge-token: <bridge-token>'
```

## 2. Push Bridge heartbeat/status

```bash
curl -X POST 'https://opensquawk.de/api/bridge/status' \
  -H 'Content-Type: application/json' \
  -H 'x-bridge-token: <bridge-token>' \
  -d '{
    "simConnected": true,
    "flightActive": false
  }'
```

## 3. Push telemetry data

```bash
curl -X POST 'https://opensquawk.de/api/bridge/data' \
  -H 'Content-Type: application/json' \
  -H 'x-bridge-token: <bridge-token>' \
  -d '{
    "AIRSPEED_INDICATED": 145.2,
    "GROUND_VELOCITY": 142.8,
    "VERTICAL_SPEED": 0,
    "PLANE_ALTITUDE": 364,
    "SIM_ON_GROUND": true
  }'
```

## 4. Link bridge token to signed-in user

This endpoint still requires a user JWT for account auth, plus the bridge token header:

```bash
curl -X POST 'https://opensquawk.de/api/bridge/connect' \
  -H 'Authorization: Bearer <user-jwt>' \
  -H 'x-bridge-token: <bridge-token>'
```
