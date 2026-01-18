import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ChatContainer from "./components/chat/ChatContainer";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/chat" element={<ChatContainer />} />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/chat" />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/chat" />}
      />
      <Route path="*" element={<Navigate to="/chat" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
