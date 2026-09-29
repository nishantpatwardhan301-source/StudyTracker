import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Tests from './pages/Tests'
import TestRunner from './pages/TestRunner'
import Pyqs from './pages/Pyqs'
import Tracker from './pages/Tracker'
import About from './pages/About'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'

function ScrollToTop() {
  const { pathname } = useLocation()
  // Braces matter: newer browsers return a Promise from scrollTo, which React
  // would otherwise treat as a cleanup function and crash on navigation.
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <ErrorBoundary key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/:paperId/:scope" element={<TestRunner />} />
          <Route path="/pyqs" element={<Pyqs />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  )
}
