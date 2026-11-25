export async function submitRsvp(endpoint, answer) {
  const response = await fetch(endpoint, {
    method: 'POST',
    // text/plain is a CORS-safelisted content type, so Apps Script receives
    // the JSON body without a preflight OPTIONS request.
    headers: {'Content-Type': 'text/plain;charset=UTF-8'},
    body: JSON.stringify(answer),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok || (await response.json()).ok !== true) {
    throw new Error('RSVP was not accepted');
  }
}

