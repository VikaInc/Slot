import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

import Home from './pages/Home';
import Places from './pages/Places';
import PlaceDetail from './pages/PlaceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';
import BookingForm from './pages/BookingForm';
import BookingView from './pages/BookingView';

import Explore from './pages/Explore';
import Forbidden from './pages/Forbidden';

function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/places" element={<Places />} />
          <Route path="/places/:id" element={<PlaceDetail />} />

          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/bookings/new" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/bookings/:id/edit" element={<ProtectedRoute><BookingForm edit /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingView /></ProtectedRoute>} />

          <Route path="/explore" element={<Explore />} />
          <Route path="/403" element={<Forbidden />} />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </main>
      <Footer />
    </>
  );
}