import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';
import PlanEditor from './pages/PlanEditor';
import Guide from './pages/Guide';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import History from './pages/History';
import TravelogueDetail from './pages/TravelogueDetail';
import UserContentList from './pages/UserContentList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="plan" element={<Plan />} />
          <Route path="guide" element={<Guide />} />
          <Route path="community" element={<Community />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/travelogue/:id" element={<TravelogueDetail />} />
        <Route path="/plan/edit" element={<PlanEditor />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/history" element={<History />} />
        
        {/* User Content Lists */}
        <Route path="/profile/journals" element={<UserContentList />} />
        <Route path="/profile/plans" element={<UserContentList />} />
        <Route path="/profile/favorites" element={<UserContentList />} />
      </Routes>
    </Router>
  );
}

export default App;
