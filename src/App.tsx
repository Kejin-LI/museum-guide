import { useEffect } from 'react';
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
import { GUEST_AVATAR } from './services/auth';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './lib/supabase';

function App() {
  // Fix for problematic avatar URL in localStorage
  useEffect(() => {
    const syncAuthUserToLocal = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data.user;
        if (!u) return;

        const email = u.email || '';
        const existingStr = localStorage.getItem('museum_user');
        let existing: any = null;
        try {
          existing = existingStr ? JSON.parse(existingStr) : null;
        } catch {
          existing = null;
        }

        if (!existing || existing.id !== u.id) {
          const name = (u.user_metadata?.name as string) || (email ? email.split('@')[0] : '探索者');
          const avatar = (u.user_metadata?.avatar_url as string) || GUEST_AVATAR;
          localStorage.setItem(
            'museum_user',
            JSON.stringify({ id: u.id, name, email, avatar })
          );
        }
      } catch {
      }
    };

    syncAuthUserToLocal();

    try {
      const userStr = localStorage.getItem('museum_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.avatar && (user.avatar.includes('photo-1604580864964') || user.avatar.includes('images.unsplash.com/'))) {
          user.avatar = GUEST_AVATAR;
          localStorage.setItem('museum_user', JSON.stringify(user));
          console.log('Fixed user avatar in localStorage');
          // Force reload to apply changes if needed, but state update should happen on next render/nav
          window.location.reload(); 
        }
      }
    } catch (e) {
      console.error('Error fixing local storage:', e);
    }
  }, []);

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
        <Route path="/reset-password" element={<ResetPassword />} />
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
