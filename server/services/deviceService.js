// check if ThingSpeak is responding by asking for 1 row
// WARNING: never log the actual URL as it contains the `channelId` and `readKey`
async function verifyChannel(channelId, readKey) {
  // build the "base" URL
  const url =
    `https://api.thingspeak.com/channels/${channelId}/feeds.json` +
    `?results=1&api_key=${encodeURIComponent(readKey)}`;

  // try to make a request and get a response from ThingSpeak
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (response.ok) return { ok: true };

    // return the following JS object if all okay
    return {
      ok: false,
      reason: "ThingSpeak rejected the channel ID or read key",
    };
  } catch {
    // return the following JS object if failed
    return { ok: false, reason: "Could not reach ThingSpeak, try again" };
  }
}

// DB row ==> API JS object ( the encrypted key never leaves the server )
function toPublic(device) {
  return {
    id: device.id,
    label: device.label,
    thingspeak_channel_id: device.thingspeak_channel_id,
    has_read_key: Boolean(device.read_key_encrypted),
    created_at: device.created_at,
  };
}

// make these functions available to other files
module.exports = { verifyChannel, toPublic };
