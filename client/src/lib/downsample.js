// shrinks a long track ( one row per second ) to about `target` rows for the charts
// NOTE: each new row keeps the PEAK of its bucket ==> a 1 second spike is never averaged away

// the value with the biggest size ( sign kept ) ==> -0.42 beats +0.30 --> `null` rows are skipped
function peakOf(rows, key) {
  let peak = null
  for (const row of rows) {
    const value = row[key]
    if (value !== null && (peak === null || Math.abs(value) > Math.abs(peak))) peak = value
  }
  return peak
}

// `rows` ==> `[{ time, ...values }]` oldest first, `keys` ==> the value columns to keep
export function downsample(rows, target, keys) {
  if (rows.length <= target) return rows

  // e.g. 1500 rows / 600 ==> buckets of 3 rows
  const bucketSize = Math.ceil(rows.length / target)
  const result = []

  for (let start = 0; start < rows.length; start += bucketSize) {
    const bucket = rows.slice(start, start + bucketSize)
    // the bucket starts at the time of its first row
    const row = { time: bucket[0].time }
    for (const key of keys) row[key] = peakOf(bucket, key)
    result.push(row)
  }

  return result
}
