import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Session from './screens/Session'
import Shop from './screens/Shop'
import Stats from './screens/Stats'
import SessionDetail from './screens/SessionDetail'
import ExercisePicker from './screens/ExercisePicker'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="session" element={<Session />} />
          <Route path="shop" element={<Shop />} />
          <Route path="stats" element={<Stats />} />
          <Route path="stats/:id" element={<SessionDetail />} />
        </Route>
        <Route path="session/picker" element={<ExercisePicker />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
