"use client";

// import Script from 'next/script';
// import { CredentialResponse } from 'google-one-tap';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// const OneTapComponent = () => {
//   const supabase = createClient();
//   const router = useRouter();

//   // Generate nonce to use for Google ID token sign-in
//   const generateNonce = async (): Promise<string[]> => {
//     const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
//     const encoder = new TextEncoder();
//     const encodedNonce = encoder.encode(nonce);
//     const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

//     return [nonce, hashedNonce];
//   };

//   useEffect(() => {
//     const initializeGoogleOneTap = () => {
//       console.log('Initializing Google One Tap');
//       window.addEventListener('load', async () => {
//         const [nonce, hashedNonce] = await generateNonce();
//         console.log('Nonce: ', nonce, hashedNonce);

//         // Check if there's already an existing session before initializing the One-Tap UI
//         const { data, error } = await supabase.auth.getSession();
//         if (error) {
//           console.error('Error getting session', error);
//         }
//         if (data.session) {
//           router.push('/');
//           return;
//         }

//         /* global google */
//         google.accounts.id.initialize({
//           client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
//           callback: async (response: CredentialResponse) => {
//             try {
//               // Send ID token returned in response.credential to Supabase
//               const { data, error } = await supabase.auth.signInWithIdToken({
//                 provider: 'google',
//                 token: response.credential,
//                 nonce,
//               });

//               if (error) throw error;
//               console.log('Session data: ', data);
//               console.log('Successfully logged in with Google One Tap');

//               // Redirect to protected page
//               router.push('/');
//             } catch (error) {
//               console.error('Error logging in with Google One Tap', error);
//             }
//           },
//           nonce: hashedNonce,
//           use_fedcm_for_prompt: true, // Use FedCM as a fallback for third-party cookies
//         });
//         google.accounts.id.prompt(); // Display the One Tap UI
//       });
//     };
//     initializeGoogleOneTap();
//     return () => window.removeEventListener('load', initializeGoogleOneTap);
//   }, []);

//   return (
//     <>
//       <Script src="https://accounts.google.com/gsi/client" />
//       <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
//     </>
//   );
// };

// export default OneTapComponent;
