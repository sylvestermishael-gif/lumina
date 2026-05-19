import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer,
  memoryLocalCache 
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

const app = initializeApp(rawConfig);

// Use initializeFirestore with optimized settings for iframe environments
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
}, rawConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);

// Validate connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to trigger a network check
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firebase Uplink: Connection verified.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firebase Uplink: Connection successful (Permissions validated).");
    } else {
      console.error("Firebase Uplink Error Code:", error.code);
      console.error("Firebase Uplink Error Message:", error.message);
      
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        const projectId = rawConfig.projectId;
        const dbId = rawConfig.firestoreDatabaseId || '(default)';
        console.warn(`
[FIREBASE CONNECTION STATUS: OFFLINE]
The Firestore client cannot reach the servers. This is ALMOST ALWAYS because the database has not been fully created yet.

ACTION REQUIRED:
1. Go to: https://console.firebase.google.com/project/${projectId}/firestore/databases/${dbId}
2. If you see a "Select Location" screen:
   - Pick "Test Mode" (it's easier for setup).
   - Pick ANY region (like 'eur3' or 'nam5').
   - Click "Create" and then "Enable".
3. Once created, wait 60 seconds and refresh this page.

Current Config: Project=${projectId}, DB=${dbId}
        `);
      }
    }
  }
}

testConnection();
