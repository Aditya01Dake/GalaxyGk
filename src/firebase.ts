import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const saveUser = async (userId: string, name: string, contact: string) => {
  const path = `users/${userId}`;
  try {
    const { doc, getDoc, setDoc, updateDoc, runTransaction } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const counterRef = doc(db, 'metadata', 'counters');
      let newCustomId = '';
      
      try {
        newCustomId = await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          let currentCount = 0;
          if (counterSnap.exists()) {
            currentCount = counterSnap.data().userCount || 0;
          }
          const nextCount = currentCount + 1;
          transaction.set(counterRef, { userCount: nextCount }, { merge: true });
          return `GK${nextCount.toString().padStart(3, '0')}`;
        });
      } catch (e) {
        console.error("Transaction failed, using fallback ID", e);
        newCustomId = `GK${Math.floor(Math.random() * 10000)}`;
      }

      let role = 'user';
      try {
        const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
        const invitesRef = collection(db, 'staff_invites');
        const q = query(invitesRef, where('email', '==', contact));
        const inviteSnap = await getDocs(q);
        if (!inviteSnap.empty) {
          role = 'staff';
          // delete the invite
          inviteSnap.forEach(doc => deleteDoc(doc.ref));
        }
      } catch (e) {
        console.error("Error checking staff invites", e);
      }

      await setDoc(userRef, {
        userId,
        name,
        contact,
        customId: newCustomId,
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      return newCustomId;
    } else {
      let role = userSnap.data().role || 'user';
      try {
        const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
        const invitesRef = collection(db, 'staff_invites');
        const q = query(invitesRef, where('email', '==', contact));
        const inviteSnap = await getDocs(q);
        if (!inviteSnap.empty) {
          role = 'staff';
          inviteSnap.forEach(doc => deleteDoc(doc.ref));
        }
      } catch (e) {
        console.error("Error checking staff invites", e);
      }

      await updateDoc(userRef, {
        name,
        contact,
        role,
        lastLogin: new Date().toISOString()
      });
      return userSnap.data().customId;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveResult = async (resultData: {
  userId: string;
  name: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
}) => {
  const path = 'results';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...resultData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
