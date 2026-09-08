import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FiShield, FiTrendingDown, FiAlertOctagon } from 'react-icons/fi'
import { BsExclamationTriangleFill, BsLightningChargeFill } from 'react-icons/bs'
import { MdCyclone } from 'react-icons/md'

/**
 * Custom Danger Alert Toast with pure React Icons (no emojis)
 * Provides actionable predictive advice for populations in cyclone threat zones.
 */
export function fireDangerToast({
  title,
  message,
  advice,
  severity = 'danger',
  Icon = BsExclamationTriangleFill,
  onClick = null,
}) {
  const borderColor =
    severity === 'danger' ? '#ff2344' : severity === 'warning' ? '#ffb020' : '#f59e0b'

  return toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, x: 60, scale: 0.92 }}
        animate={{
          opacity: t.visible ? 1 : 0,
          x: t.visible ? 0 : 60,
          scale: t.visible ? 1 : 0.92,
        }}
        transition={{ duration: 0.3 }}
        className="danger-toast"
        style={{ borderLeftColor: borderColor, cursor: onClick ? 'pointer' : 'default' }}
        onClick={() => {
          if (onClick) onClick()
          toast.dismiss(t.id)
        }}
      >
        <div className="dt-header">
          <Icon size={16} color={borderColor} style={{ flexShrink: 0 }} />
          <span className="dt-title" style={{ color: borderColor }}>
            {title}
          </span>
          <span
            className="dt-badge"
            style={{
              background: `${borderColor}22`,
              color: borderColor,
              border: `1px solid ${borderColor}55`,
            }}
          >
            ALERT
          </span>
        </div>
        <div className="dt-message">{message}</div>
        <div className="dt-advice">
          <FiShield size={12} style={{ flexShrink: 0 }} />
          <span>{advice}</span>
        </div>
      </motion.div>
    ),
    { duration: 9000, position: 'top-right' }
  )
}

/**
 * Checks a storm and its prediction object, and fires danger toasts if conditions are critical.
 */
export function checkAndFireStormAlerts(storm, pred, onNavigate = null) {
  if (!storm) return
  const stormName = (storm?.name || 'This cyclone').toUpperCase()
  const wind = storm?.wind_speed || 0
  const isRI = pred?.rapid_intensify || (pred?.ri_probability && pred.ri_probability >= 0.4)
  const riProb = Math.round(((pred?.ri_probability ?? 0.31) * 100))
  const pDrop24h = pred?.pressure_trend_24h ?? -7.4
  const sst = pred?.sst ?? 29.2
  const windShear = pred?.wind_shear ?? 13.5
  const rh = pred?.relative_humidity ?? 78.0

  let delay = 600

  if (storm?.category >= 5) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: BsExclamationTriangleFill,
          title: `CAT 5 EXTREME DANGER — ${stormName}`,
          message: `Catastrophic Category 5 hurricane with ${Math.round(wind)} kt sustained winds. Extreme structural damage & storm surge imminent.`,
          advice: 'EVACUATE immediately. All coastal zones and barrier islands — leave NOW.',
          severity: 'danger',
          onClick: onNavigate,
        }),
      delay
    )
    delay += 1200
  } else if (storm?.category >= 4) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: MdCyclone,
          title: `CAT 4 MAJOR HURRICANE — ${stormName}`,
          message: `Severe Category 4 system. ${Math.round(wind)} kt winds, catastrophic storm surge possible along coastline.`,
          advice: 'Evacuate Zones A & B. Seek certified cyclone shelter immediately.',
          severity: 'danger',
          onClick: onNavigate,
        }),
      delay
    )
    delay += 1200
  } else if (storm?.category >= 3) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: MdCyclone,
          title: `CAT 3 MAJOR HURRICANE — ${stormName}`,
          message: `Major hurricane with ${Math.round(wind)} kt winds. Devastating wind damage and coastal flooding expected.`,
          advice: 'Evacuate low-lying coastal areas. Secure property and stock emergency supplies.',
          severity: 'warning',
          onClick: onNavigate,
        }),
      delay
    )
    delay += 1200
  }

  if (isRI) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: BsLightningChargeFill,
          title: `RAPID INTENSIFICATION — ${stormName}`,
          message: `AI ensemble warns of explosive intensification: ≥30 kt wind increase within 24h. RI probability is ${riProb}%.`,
          advice: 'Do NOT wait for updated advisories. Begin precautionary evacuation immediately.',
          severity: 'danger',
          onClick: onNavigate,
        }),
      delay
    )
    delay += 1200
  }

  if (Math.abs(pDrop24h) >= 15) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: FiTrendingDown,
          title: `EXPLOSIVE DEEPENING — ${stormName}`,
          message: `Pressure dropping ${pDrop24h} hPa / 24h. Rapid thermodynamic intensification underway.`,
          advice: 'Eyewall replacement or explosive vortex tightening occurring. Monitor official tracks.',
          severity: 'warning',
          onClick: onNavigate,
        }),
      delay
    )
    delay += 1200
  }

  const riDiag = pred?.ri_diagnostics || {}
  const allPrecursorsMet =
    (riDiag.sst_favorable ?? sst >= 28.0) &&
    (riDiag.shear_favorable ?? windShear <= 12.0) &&
    (riDiag.humidity_favorable ?? rh >= 70.0)

  if (allPrecursorsMet && !isRI && storm?.category >= 1) {
    setTimeout(
      () =>
        fireDangerToast({
          Icon: FiAlertOctagon,
          title: `CONDITIONS CRITICAL — ${stormName}`,
          message: `All environmental precursors met: warm SST (${sst}°C), low shear (${windShear} kt), and saturated humidity. Rapid strengthening possible.`,
          advice: 'Prepare emergency response plan and review local evacuation zones.',
          severity: 'warning',
          onClick: onNavigate,
        }),
      delay
    )
  }
}
