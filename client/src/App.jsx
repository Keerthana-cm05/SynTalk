import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import { WelcomeProvider } from './context/WelcomeContext'
import ProtectedRoute      from './components/layout/ProtectedRoute'
import DashboardLayout     from './components/layout/DashboardLayout'
import NotFound            from './pages/NotFound'

import LandingPage         from './pages/landing/LandingPage'
import LoginPage           from './pages/Auth/LoginPage'
import SignupPage          from './pages/Auth/SignupPage'
import GestureSetupPage    from './pages/Auth/GestureSetupPage'

import MainDashboard       from './pages/Dashboard/MainDashboard'
import TrainingPage        from './pages/Dashboard/TrainingPage'
import HistoryPage         from './pages/Dashboard/HistoryPage'
import EmergencyPage       from './pages/Dashboard/EmergencyPage'
import SettingsPage        from './pages/Dashboard/SettingsPage'

export default function App() {
  return (
    <div className="noise">
      <AuthProvider>
        <WelcomeProvider>
          <Routes>
            {/* Public */}
            <Route path="/"       element={<LandingPage/>}/>
            <Route path="/login"  element={<LoginPage/>}/>
            <Route path="/signup" element={<SignupPage/>}/>

            {/* Post-signup gesture setup */}
            <Route path="/gesture-setup"
              element={
                <ProtectedRoute>
                  <GestureSetupPage/>
                </ProtectedRoute>
              }
            />

            {/* Dashboard — nested layout */}
            <Route path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout/>
                </ProtectedRoute>
              }
            >
              <Route index             element={<MainDashboard/>}/>
              <Route path="training"   element={<TrainingPage/>}/>
              <Route path="history"    element={<HistoryPage/>}/>
              <Route path="emergency"  element={<EmergencyPage/>}/>
              <Route path="settings"   element={<SettingsPage/>}/>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound/>}/>
          </Routes>
        </WelcomeProvider>
      </AuthProvider>
    </div>
  )
}
