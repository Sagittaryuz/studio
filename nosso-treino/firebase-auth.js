const GOOGLE_CLIENT_ID = '344238091063-g9ucmgcsh6m62n0abd18umk26osfqrfe.apps.googleusercontent.com';

function notifyGoogleError(code) {
  window.dispatchEvent(new CustomEvent('nt-google-auth-error', { detail: `auth/${code}` }));
}

async function acceptGoogleCredential(response) {
  try {
    const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(response.credential)}`);
    if (!verification.ok) throw new Error('invalid-google-token');
    const profile = await verification.json();
    if (profile.aud !== GOOGLE_CLIENT_ID || !profile.sub || !profile.email) throw new Error('invalid-google-profile');

    window.ntGoogleCurrentUser = {
      uid: profile.sub,
      displayName: profile.name,
      email: profile.email
    };
    window.dispatchEvent(new CustomEvent('nt-google-auth-changed', { detail: window.ntGoogleCurrentUser }));
  } catch (error) {
    notifyGoogleError(error.message || 'profile-unavailable');
  }
}

function renderGoogleButton() {
  const target = document.getElementById('google-login');
  if (!target || !window.google?.accounts?.id) {
    notifyGoogleError('google-library-unavailable');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: acceptGoogleCredential,
    ux_mode: 'popup',
    use_fedcm_for_prompt: true
  });
  window.google.accounts.id.renderButton(target, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: Math.min(360, Math.max(240, target.clientWidth || 300)),
    locale: 'pt-BR'
  });
}

window.ntGoogleSignOut = () => {
  window.google?.accounts?.id?.disableAutoSelect();
  window.ntGoogleCurrentUser = null;
  return Promise.resolve();
};
window.ntGoogleCurrentUser = null;

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', renderGoogleButton, { once: true });
} else {
  renderGoogleButton();
}
