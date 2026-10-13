export class PaperError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function apiError(error: unknown) {
  if (error instanceof PaperError) return Response.json({ error: error.message }, { status: error.status });
  // Never return SDK messages, headers, or secrets to the browser.
  return Response.json({ error: 'The paper could not be processed. Please try again.' }, { status: 500 });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    const requestUrl=new URL(request.url);
    let parsed:URL;
    try{parsed=new URL(origin);}catch{throw new PaperError('Request origin is not allowed.',403);}
    if(parsed.host!==(request.headers.get('host')||requestUrl.host) || parsed.protocol!==requestUrl.protocol) throw new PaperError('Request origin is not allowed.',403);
  }
}
