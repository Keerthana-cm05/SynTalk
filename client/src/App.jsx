import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'
import { WelcomeProvider } from './context/WelcomeContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

import LandingPage             from './pages/Landing/LandingPage'
import LoginPage               from './pages/Auth/LoginPage'
import SignupPage              from './pages/Auth/SignupPage'
import GestureSetupPlaceholder from './pages/Auth/GestureSetupPlaceholder'

import MainDashboard   from './pages/Dashboard/MainDashboard'
import TrainingPage    from './pages/Dashboard/TrainingPage'
import HistoryPage     from './pages/Dashboard/HistoryPage'
import EmergencyPage   from './pages/Dashboard/EmergencyPage'
import SettingsPage    from './pages/Dashboard/SettingsPage'

export default function App() {
  return (
    <div className="noise">
      <AuthProvider>
        <WelcomeProvider>
          <Routes>
            {/* Public */}
            <Route path="/"       element={<LandingPage />} />
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Gesture setup */}
            <Route
              path="/gesture-setup"
              element={
                <ProtectedRoute>
                  <GestureSetupPlaceholder />
                </ProtectedRoute>
              }
            />

            {/* Dashboard — protected nested */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index                element={<MainDashboard />} />
              <Route path="training"      element={<TrainingPage />} />
              <Route path="history"       element={<HistoryPage />} />
              <Route path="emergency"     element={<EmergencyPage />} />
              <Route path="settings"      element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WelcomeProvider>
      </AuthProvider>
    </div>
  )
}