// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'xa000m3ogl'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/uat`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  domain: 'dev-a8bculb22igx142g.us.auth0.com',            // Auth0 domain
  clientId: 'rJdCzELERYuJ8lSdDjRPtG7OnAxTMtIu',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
