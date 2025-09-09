import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'



function Home() {
  return (
    <></>
  )
}

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
