import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const firebaseConfig = {
  projectId: 'studio-2024049853-7fbf4',
  appId: '1:344238091063:web:2da84bdafa15fffe7388b2',
  storageBucket: 'studio-2024049853-7fbf4.appspot.com',
  apiKey: 'AIzaSyB1ZqFqXC2tS0Ht5ncDHYnyaAY7HRSX-ms',
  authDomain: 'studio-2024049853-7fbf4.firebaseapp.com',
  measurementId: 'G-D4T13233CH',
  messagingSenderId: '344238091063'
};

const auth = getAuth(initializeApp(firebaseConfig));
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

function publicUser(user) {
  return user ? {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email
  } : null;
}

window.ntGoogleSignIn = async () => publicUser((await signInWithPopup(auth, provider)).user);
window.ntGoogleSignOut = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  window.ntGoogleCurrentUser = publicUser(user);
  window.dispatchEvent(new CustomEvent('nt-google-auth-changed', { detail: window.ntGoogleCurrentUser }));
});
