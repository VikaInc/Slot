import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'bookings';

export async function createBooking(data, user) {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    ownerId: user.uid,
    ownerName: user.displayName || user.email,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listMyBookings(userId) {
  const q = query(collection(db, COL), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBooking(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Бронь не найдена');
  return { id: snap.id, ...snap.data() };
}

export async function updateBooking(id, data) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteBooking(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function listAllBookings() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}