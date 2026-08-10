const GOOGLE_CLIENT_ID = '344238091063-g9ucmgcsh6m62n0abd18umk26osfqrfe.apps.googleusercontent.com';
let activeGoogleToken = null;

function googleLoginError(code, message) {
  return Object.assign(new Error(message || code), { code: `auth/${code}` });
}

window.ntGoogleSignIn = () => new Promise((resolve, reject) => {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    reject(googleLoginError('google-library-unavailable', 'O serviço do Google não carregou.'));
    return;
  }

  const tokenClient = oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
    callback: async (response) => {
      if (response.error || !response.access_token) {
        reject(googleLoginError(response.error || 'google-token-error', response.error_description));
        return;
      }

      try {
        activeGoogleToken = response.access_token;
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${activeGoogleToken}` }
        });
        if (!profileResponse.ok) throw googleLoginError('profile-unavailable', 'O perfil do Google não pôde ser confirmado.');
        const profile = await profileResponse.json();
        resolve({
          uid: profile.sub,
          displayName: profile.name,
          email: profile.email
        });
      } catch (error) {
        reject(error?.code ? error : googleLoginError('profile-unavailable', error?.message));
      }
    },
    error_callback: (response) => {
      reject(googleLoginError(response.type || 'popup-error', response.message));
    }
  });

  tokenClient.requestAccessToken({ prompt: 'select_account' });
});

window.ntGoogleSignOut = () => {
  if (activeGoogleToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(activeGoogleToken);
  }
  activeGoogleToken = null;
  return Promise.resolve();
};

window.ntGoogleCurrentUser = null;
