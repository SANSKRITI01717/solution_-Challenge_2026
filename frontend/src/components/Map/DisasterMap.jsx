import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet'
import { getPriorityColor, getPriorityLevel, getSkillIcon } from '../../utils/priority'

// Fit map bounds to markers
function FitBounds({ zones }) {
  const map = useMap()
  useEffect(() => {
    if (zones.length === 0) return
    const bounds = zones.map(z => [z.lat, z.lng])
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [zones, map])
  return null
}

export default function DisasterMap({ zones, volunteers, assignments }) {
  const [activeZone, setActiveZone] = useState(null)

  // Build assignment lines: volunteer → zone
  const assignmentLines = assignments.map(a => {
    const vol  = volunteers.find(v => v._id === a.volunteerId?._id || v._id === a.volunteerId)
    const zone = zones.find(z => z._id === a.zoneId?._id || z._id === a.zoneId)
    if (!vol || !zone) return null
    return { from: [vol.lat, vol.lng], to: [zone.lat, zone.lng], skill: vol.skill }
  }).filter(Boolean)

  const center = zones.length > 0
    ? [zones[0].lat, zones[0].lng]
    : [22.7196, 75.8577]  // Default: Indore

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', minHeight: 420 }}
      className="rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {zones.length > 0 && <FitBounds zones={zones} />}

      {/* Assignment lines */}
      {assignmentLines.map((line, i) => (
        <Polyline
          key={i}
          positions={[line.from, line.to]}
          color={line.skill === 'rescue' ? '#ef4444' : line.skill === 'medical' ? '#3b82f6' : '#a855f7'}
          weight={2}
          dashArray="6 4"
          opacity={0.7}
        />
      ))}

      {/* Disaster Zone circles */}
      {zones.map(zone => {
        const color   = getPriorityColor(zone.priorityScore)
        const radius  = Math.max(20, Math.min(60, zone.peopleAffected / 100))
        const level   = getPriorityLevel(zone.priorityScore)
        return (
          <CircleMarker
            key={zone._id}
            center={[zone.lat, zone.lng]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.35,
              color: color,
              weight: level === 'critical' ? 3 : 2,
            }}
            eventHandlers={{ click: () => setActiveZone(zone) }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{zone.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Priority score: <strong style={{ color }}>{zone.priorityScore?.toFixed(2)}</strong>
                </div>
                <table style={{ fontSize: 12, width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ color: '#64748b' }}>Severity</td><td><strong>{zone.severity}/10</strong></td></tr>
                    <tr><td style={{ color: '#64748b' }}>Affected</td><td><strong>{zone.peopleAffected?.toLocaleString()}</strong></td></tr>
                    <tr><td style={{ color: '#64748b' }}>Needs</td><td><strong>{getSkillIcon(zone.requiredSkill)} {zone.requiredSkill}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Volunteer pins */}
      {volunteers.map(vol => (
        <CircleMarker
          key={vol._id}
          center={[vol.lat, vol.lng]}
          radius={8}
          pathOptions={{
            fillColor: vol.available ? '#10b981' : '#94a3b8',
            fillOpacity: 0.9,
            color: '#fff',
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
              <strong>{vol.name}</strong><br />
              {getSkillIcon(vol.skill)} {vol.skill}<br />
              <span style={{ color: vol.available ? '#10b981' : '#94a3b8' }}>
                {vol.available ? '● Available' : '● Assigned'}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
