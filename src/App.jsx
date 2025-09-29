import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ListPage from './pages/ListPage'
import CafeDetailPage from './pages/CafeDetailPage'
import NewsPage from './pages/NewsPage'
import PassportPage from './pages/PassportPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/cafe/:id" element={<CafeDetailPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App